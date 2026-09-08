import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { purchaseOrdersApi } from "../../services/purchaseOrders.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";
import PurchaseOrderCreateModal from "./PurchaseOrderCreateModal";
import PurchaseOrderDetailModal from "./PurchaseOrderDetailModal";
import PurchaseOrderHistoryModal from "./PurchaseOrderHistoryModal";

function PurchaseOrders() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("purchase_orders.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({ search: "", status: "" });

  const [purchaseOrders, { refetch }] = createResource(
    () => ({ ...appliedFilters(), page: currentPage(), limit: limit() }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.status) filters.status = params.status;
      filters.page = params.page;
      filters.limit = params.limit;
      return purchaseOrdersApi.getAll(filters);
    },
  );

  const [showCreateModal, setShowCreateModal] = createSignal(false);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedOrder, setSelectedOrder] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailOrder, setDetailOrder] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({ search: searchInput(), status: statusInput() });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", status: "" });
    setCurrentPage(1);
  };

  const openHistory = (order) => {
    setSelectedOrder(order);
    setShowHistoryModal(true);
  };

  const openDetail = (order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Órdenes de compra
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Órdenes formales generadas a partir de cotizaciones recibidas
              </p>
            </div>
            <Show when={auth.hasPermission("purchase_orders.create")}>
              <button onClick={() => setShowCreateModal(true)} class="btn-primary">
                + Generar orden de compra
              </button>
            </Show>
          </div>

          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Filtros</p>
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
                <option value="draft">Borrador</option>
                <option value="approved">Aprobada</option>
                <option value="cancelled">Cancelada</option>
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

          <div class="card overflow-hidden p-0">
            <Show when={purchaseOrders.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando órdenes de compra...
              </div>
            </Show>

            <Show when={purchaseOrders.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar órdenes de compra
              </div>
            </Show>

            <Show when={purchaseOrders()}>
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
                      Sucursal / Almacén
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha esperada
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={purchaseOrders()?.data}>
                    {(order) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {order.code}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {order.supplier?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {order.branch?.name} / {order.warehouse?.name}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatMoney(order.total, order.currency)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {order.expectedDate
                            ? new Date(order.expectedDate).toLocaleDateString("es-ES")
                            : "-"}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(order.status)}`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(order)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(order)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>

              <Show when={purchaseOrders()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={purchaseOrders().pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showCreateModal()}>
          <PurchaseOrderCreateModal
            onClose={() => setShowCreateModal(false)}
            onSaved={handleCreated}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <PurchaseOrderHistoryModal
            purchaseOrder={selectedOrder()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <PurchaseOrderDetailModal
            purchaseOrder={detailOrder()}
            onClose={() => setShowDetailModal(false)}
            onChanged={refetch}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default PurchaseOrders;
