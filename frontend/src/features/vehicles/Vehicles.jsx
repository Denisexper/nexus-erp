import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { vehiclesApi } from "../../services/vehicles.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import VehicleFormModal from "./VehicleFormModal";
import VehicleHistoryModal from "./VehicleHistoryModal";
import VehicleDetailModal from "./VehicleDetailModal";

function Vehicles() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("vehicles.view")) {
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

  const [vehicles, { refetch }] = createResource(
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
      return vehiclesApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingVehicle, setEditingVehicle] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedVehicle, setSelectedVehicle] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailVehicle, setDetailVehicle] = createSignal(null);

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
    setEditingVehicle(null);
    setShowFormModal(true);
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowFormModal(true);
  };

  const openHistory = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowHistoryModal(true);
  };

  const openDetail = (vehicle) => {
    setDetailVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (vehicle) => {
    const action = vehicle.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} el vehículo ${vehicle.plate}?`,
      async () => {
        try {
          if (vehicle.isActive) {
            await vehiclesApi.deactivate(vehicle._id);
          } else {
            await vehiclesApi.activate(vehicle._id);
          }
          refetch();
          showToast.success(
            `Vehículo ${action === "desactivar" ? "desactivado" : "activado"} correctamente`,
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
                Vehículos
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra la flota utilizada para traslados y distribución
              </p>
            </div>
            <Show when={auth.hasPermission("vehicles.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nuevo vehículo
              </button>
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
                placeholder="Buscar por placa, marca o modelo..."
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
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
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
            <Show when={vehicles.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando vehículos...
              </div>
            </Show>

            <Show when={vehicles.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar vehículos
              </div>
            </Show>

            <Show when={vehicles()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Placa
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Conductor responsable
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={vehicles()?.data}>
                    {(vehicle) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {vehicle.year}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {vehicle.plate}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {vehicle.employee
                            ? `${vehicle.employee.firstName} ${vehicle.employee.lastName}`
                            : "-"}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${vehicle.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {vehicle.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(vehicle)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(vehicle)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("vehicles.update")}>
                              <button
                                onClick={() => openEdit(vehicle)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (vehicle.isActive &&
                                  auth.hasPermission("vehicles.deactivate")) ||
                                (!vehicle.isActive &&
                                  auth.hasPermission("vehicles.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(vehicle)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  vehicle.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {vehicle.isActive
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

              <Show when={vehicles()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={vehicles().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <VehicleFormModal
            vehicle={editingVehicle()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <VehicleHistoryModal
            vehicle={selectedVehicle()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <VehicleDetailModal
            vehicle={detailVehicle()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Vehicles;
