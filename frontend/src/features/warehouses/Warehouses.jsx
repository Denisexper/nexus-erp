import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { warehousesApi } from "../../services/warehouses.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import WarehouseFormModal from "./WarehouseFormModal";
import WarehouseHistoryModal from "./WarehouseHistoryModal";
import WarehouseDetailModal from "./WarehouseDetailModal";

function Warehouses() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("warehouses.view")) {
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

  const [warehouses, { refetch }] = createResource(
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
      return warehousesApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingWarehouse, setEditingWarehouse] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedWarehouse, setSelectedWarehouse] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailWarehouse, setDetailWarehouse] = createSignal(null);

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
    setEditingWarehouse(null);
    setShowFormModal(true);
  };

  const openEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setShowFormModal(true);
  };

  const openHistory = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowHistoryModal(true);
  };

  const openDetail = (warehouse) => {
    setDetailWarehouse(warehouse);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (warehouse) => {
    const action = warehouse.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${warehouse.name}?`,
      async () => {
        try {
          if (warehouse.isActive) {
            await warehousesApi.deactivate(warehouse._id);
          } else {
            await warehousesApi.activate(warehouse._id);
          }
          refetch();
          showToast.success(
            `Almacén ${action === "desactivar" ? "desactivado" : "activado"} correctamente`,
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
                Almacenes
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra los almacenes de cada sucursal
              </p>
            </div>
            <Show when={auth.hasPermission("warehouses.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nuevo almacén
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
                placeholder="Buscar por nombre..."
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
            <Show when={warehouses.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando almacenes...
              </div>
            </Show>

            <Show when={warehouses.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar almacenes
              </div>
            </Show>

            <Show when={warehouses()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Almacén
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={warehouses()?.data}>
                    {(warehouse) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {warehouse.name}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {warehouse.description || "-"}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {warehouse.warehouseCategory?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {warehouse.branch?.name || "-"}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${warehouse.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {warehouse.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(warehouse)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(warehouse)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("warehouses.update")}>
                              <button
                                onClick={() => openEdit(warehouse)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (warehouse.isActive &&
                                  auth.hasPermission("warehouses.deactivate")) ||
                                (!warehouse.isActive &&
                                  auth.hasPermission("warehouses.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(warehouse)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  warehouse.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {warehouse.isActive
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

              <Show when={warehouses()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={warehouses().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <WarehouseFormModal
            warehouse={editingWarehouse()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <WarehouseHistoryModal
            warehouse={selectedWarehouse()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <WarehouseDetailModal
            warehouse={detailWarehouse()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Warehouses;
