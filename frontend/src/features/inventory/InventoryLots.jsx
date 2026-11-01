import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { inventoryApi } from "../../services/inventory.api";
import { productsApi } from "../../services/products.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import AssignLocationModal from "./AssignLocationModal";
import LabelPrintModal from "./LabelPrintModal";

const STATUS_LABELS = {
  pending_placement: "Pendiente de ubicar",
  partially_placed: "Ubicado parcial",
  placed: "Ubicado",
  cancelled: "Cancelado",
};

const STATUS_BADGE_CLASS = {
  pending_placement: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  partially_placed: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  placed: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
};

function InventoryLots() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("inventory.lots.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(15);

  const [statusFilter, setStatusFilter] = createSignal("");
  const [productFilter, setProductFilter] = createSignal("");
  const [productFilterLabel, setProductFilterLabel] = createSignal("");
  const [appliedFilters, setAppliedFilters] = createSignal({});

  const [lots, { refetch }] = createResource(
    () => ({ ...appliedFilters(), page: currentPage(), limit: limit() }),
    (params) => inventoryApi.getLots(params),
  );

  const [showAssignModal, setShowAssignModal] = createSignal(false);
  const [assigningLot, setAssigningLot] = createSignal(null);

  const [showLabelModal, setShowLabelModal] = createSignal(false);
  const [labelingLot, setLabelingLot] = createSignal(null);

  const applyFilters = () => {
    const filters = {};
    if (statusFilter()) filters.status = statusFilter();
    if (productFilter()) filters.product = productFilter();
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setProductFilter("");
    setProductFilterLabel("");
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const openAssign = (lot) => {
    setAssigningLot(lot);
    setShowAssignModal(true);
  };

  const handleAssigned = () => {
    setShowAssignModal(false);
    refetch();
  };

  const openLabel = (lot) => {
    setLabelingLot(lot);
    setShowLabelModal(true);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Lotes de inventario
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Lotes generados al confirmar recepciones de compra, pendientes o ya ubicados en un almacén
            </p>
          </div>

          {/* Filtros */}
          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filtros
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SearchableSelect
                value={productFilter()}
                displayLabel={productFilterLabel()}
                onChange={(id, item) => {
                  setProductFilter(id);
                  setProductFilterLabel(item?.name || "");
                }}
                placeholder="Todos los productos"
                fetchOptions={async (search) => {
                  const res = await productsApi.getAll({ search, isActive: true, limit: 20 });
                  return res.data || [];
                }}
                getOptionLabel={(p) => p.name}
                getOptionSubLabel={(p) => p.internalCode}
              />

              <select
                class="input-field"
                value={statusFilter()}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <For each={Object.entries(STATUS_LABELS)}>
                  {([value, label]) => <option value={value}>{label}</option>}
                </For>
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
            <Show when={lots.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando lotes...
              </div>
            </Show>

            <Show when={lots.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar lotes
              </div>
            </Show>

            <Show when={lots()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lote
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recibido
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ubicado
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo unit.
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={lots()?.data}>
                    {(lot) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {lot.lotCode}
                        </td>
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {lot.product?.name || "-"}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {lot.product?.internalCode}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {lot.quantityReceived}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {lot.quantityAssigned} / {lot.quantityReceived}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          ${lot.unitCost?.toFixed(2)}
                        </td>
                        <td class="px-6 py-4">
                          <span class={`text-xs px-2 py-1 rounded-md ${STATUS_BADGE_CLASS[lot.status]}`}>
                            {STATUS_LABELS[lot.status] || lot.status}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center justify-end gap-2">
                            <Show
                              when={
                                ["pending_placement", "partially_placed"].includes(lot.status) &&
                                auth.hasPermission("inventory.location.assign")
                              }
                            >
                              <button
                                onClick={() => openAssign(lot)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Ubicar
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("inventory.label.print")}>
                              <button
                                onClick={() => openLabel(lot)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Etiquetas
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>

              <Show when={lots()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={lots().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showAssignModal()}>
          <AssignLocationModal
            lot={assigningLot()}
            onClose={() => setShowAssignModal(false)}
            onSaved={handleAssigned}
          />
        </Show>

        <Show when={showLabelModal()}>
          <LabelPrintModal
            lot={labelingLot()}
            onClose={() => setShowLabelModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default InventoryLots;
