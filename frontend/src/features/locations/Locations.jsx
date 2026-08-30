import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { locationsApi } from "../../services/locations.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import LocationFormModal from "./LocationFormModal";
import LocationBatchModal from "./LocationBatchModal";
import LocationHistoryModal from "./LocationHistoryModal";
import LocationDetailModal from "./LocationDetailModal";

function Locations() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("locations.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    isActive: "",
  });

  const [locations, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return locationsApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingLocation, setEditingLocation] = createSignal(null);

  const [showBatchModal, setShowBatchModal] = createSignal(false);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedLocation, setSelectedLocation] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailLocation, setDetailLocation] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingLocation(null);
    setShowFormModal(true);
  };

  const openEdit = (location) => {
    setEditingLocation(location);
    setShowFormModal(true);
  };

  const openHistory = (location) => {
    setSelectedLocation(location);
    setShowHistoryModal(true);
  };

  const openDetail = (location) => {
    setDetailLocation(location);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const handleBatchSaved = () => {
    setShowBatchModal(false);
    refetch();
  };

  const toggleStatus = async (location) => {
    const action = location.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} la ubicación ${location.code}?`,
      async () => {
        try {
          if (location.isActive) {
            await locationsApi.deactivate(location._id);
          } else {
            await locationsApi.activate(location._id);
          }
          refetch();
          showToast.success(
            `Ubicación ${action === "desactivar" ? "desactivada" : "activada"} correctamente`,
          );
        } catch (error) {
          showToast.error(error.message);
        }
      },
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Ubicaciones
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra la estructura física (pasillo, estante, nivel y
                posición) dentro de cada almacén
              </p>
            </div>
            <Show when={auth.hasPermission("locations.create")}>
              <div class="flex gap-3">
                <button
                  onClick={() => setShowBatchModal(true)}
                  class="btn-secondary"
                >
                  Generar por lotes
                </button>
                <button onClick={openCreate} class="btn-primary">
                  + Nueva ubicación
                </button>
              </div>
            </Show>
          </div>

          {/* Filtros */}
          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filtros
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                class="input-field"
                placeholder="Buscar por código..."
                value={searchInput()}
                onInput={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />

              <select
                class="input-field"
                value={statusInput()}
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </div>

            <div class="flex gap-3 mt-4">
              <button onClick={applyFilters} class="btn-primary">
                🔍 Buscar
              </button>
              <button onClick={clearFilters} class="btn-secondary">
                ✕ Limpiar filtros
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div class="card overflow-hidden p-0">
            <Show when={locations.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando ubicaciones...
              </div>
            </Show>

            <Show when={locations.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar ubicaciones
              </div>
            </Show>

            <Show when={locations()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Almacén
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Coordenadas
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Capacidad
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={locations()?.data}>
                    {(location) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {location.code}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {location.notes || "-"}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {location.warehouse?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {[
                            location.aisle && `Pasillo ${location.aisle}`,
                            location.rack && `Estante ${location.rack}`,
                            location.level && `Nivel ${location.level}`,
                            location.position && `Posición ${location.position}`,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {location.capacity}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${location.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {location.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(location)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(location)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("locations.update")}>
                              <button
                                onClick={() => openEdit(location)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (location.isActive &&
                                  auth.hasPermission("locations.deactivate")) ||
                                (!location.isActive &&
                                  auth.hasPermission("locations.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(location)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  location.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {location.isActive
                                  ? "🔒 Desactivar"
                                  : "✅ Activar"}
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>

              <Show when={locations()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={locations().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <LocationFormModal
            location={editingLocation()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showBatchModal()}>
          <LocationBatchModal
            onClose={() => setShowBatchModal(false)}
            onSaved={handleBatchSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <LocationHistoryModal
            location={selectedLocation()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <LocationDetailModal
            location={detailLocation()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Locations;
