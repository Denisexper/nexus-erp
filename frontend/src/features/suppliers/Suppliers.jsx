import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { suppliersApi } from "../../services/suppliers.api";
import { countriesApi } from "../../services/countries.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import SupplierFormModal from "./SupplierFormModal";
import SupplierHistoryModal from "./SupplierHistoryModal";
import SupplierDetailModal from "./SupplierDetailModal";

function Suppliers() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("suppliers.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [countryInput, setCountryInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    country: "",
    isActive: "",
  });

  const [countriesList] = createResource(() =>
    countriesApi.getAll({ limit: 1000 }),
  );

  const [suppliers, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.country) filters.country = params.country;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return suppliersApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingSupplier, setEditingSupplier] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedSupplier, setSelectedSupplier] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailSupplier, setDetailSupplier] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      country: countryInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setCountryInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", country: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };

  const openHistory = (supplier) => {
    setSelectedSupplier(supplier);
    setShowHistoryModal(true);
  };

  const openDetail = (supplier) => {
    setDetailSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (supplier) => {
    const action = supplier.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${supplier.name}?`,
      async () => {
        try {
          if (supplier.isActive) {
            await suppliersApi.deactivate(supplier._id);
          } else {
            await suppliersApi.activate(supplier._id);
          }
          refetch();
          showToast.success(
            `Proveedor ${action === "desactivar" ? "desactivado" : "activado"} correctamente`,
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
                Proveedores
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra los proveedores del catálogo de productos
              </p>
            </div>
            <Show when={auth.hasPermission("suppliers.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nuevo proveedor
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
                placeholder="Buscar por código, nombre, email o teléfono..."
                value={searchInput()}
                onInput={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />

              <select
                class="input-field"
                value={countryInput()}
                onChange={(e) => setCountryInput(e.target.value)}
              >
                <option value="">Todos los países</option>
                <For each={countriesList()?.data}>
                  {(c) => <option value={c._id}>{c.name}</option>}
                </For>
              </select>

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
            <Show when={suppliers.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando proveedores...
              </div>
            </Show>

            <Show when={suppliers.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar proveedores
              </div>
            </Show>

            <Show when={suppliers()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      País
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={suppliers()?.data}>
                    {(supplier) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {supplier.code}
                        </td>
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {supplier.name}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {supplier.address || "-"}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {supplier.country?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <p>{supplier.phone || "-"}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {supplier.email || "-"}
                          </p>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${supplier.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {supplier.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(supplier)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(supplier)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("suppliers.update")}>
                              <button
                                onClick={() => openEdit(supplier)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (supplier.isActive &&
                                  auth.hasPermission(
                                    "suppliers.deactivate",
                                  )) ||
                                (!supplier.isActive &&
                                  auth.hasPermission("suppliers.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(supplier)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  supplier.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {supplier.isActive
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

              <Show when={suppliers()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={suppliers().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <SupplierFormModal
            supplier={editingSupplier()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <SupplierHistoryModal
            supplier={selectedSupplier()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <SupplierDetailModal
            supplier={detailSupplier()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Suppliers;
