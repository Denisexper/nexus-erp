import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { purchasesApi } from "../../services/purchases.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";
import PurchaseCreateModal from "./PurchaseCreateModal";
import PurchaseDetailModal from "./PurchaseDetailModal";
import PurchaseHistoryModal from "./PurchaseHistoryModal";

function Purchases() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("purchases.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({ search: "", status: "" });

  const [purchases, { refetch }] = createResource(
    () => ({ ...appliedFilters(), page: currentPage(), limit: limit() }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.status) filters.status = params.status;
      filters.page = params.page;
      filters.limit = params.limit;
      return purchasesApi.getAll(filters);
    },
  );

  const [showCreateModal, setShowCreateModal] = createSignal(false);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedPurchase, setSelectedPurchase] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailPurchase, setDetailPurchase] = createSignal(null);

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

  const openHistory = (purchase) => {
    setSelectedPurchase(purchase);
    setShowHistoryModal(true);
  };

  const openDetail = (purchase) => {
    setDetailPurchase(purchase);
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
                Recepción de compras
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Mercancía realmente recibida contra órdenes de compra aprobadas
              </p>
            </div>
            <Show when={auth.hasPermission("purchases.create")}>
              <button onClick={() => setShowCreateModal(true)} class="btn-primary">
                + Registrar recepción
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
                <option value="received">Recibida</option>
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
            <Show when={purchases.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando recepciones...
              </div>
            </Show>

            <Show when={purchases.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar recepciones
              </div>
            </Show>

            <Show when={purchases()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Orden de compra
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={purchases()?.data}>
                    {(purchase) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {purchase.code}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {purchase.purchaseOrder?.code || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {purchase.supplier?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatMoney(purchase.total, purchase.currency)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {purchase.purchaseDate
                            ? new Date(purchase.purchaseDate).toLocaleDateString("es-ES")
                            : "-"}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(purchase.status)}`}
                          >
                            {statusLabel(purchase.status)}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(purchase)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(purchase)}
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

              <Show when={purchases()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={purchases().pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showCreateModal()}>
          <PurchaseCreateModal
            onClose={() => setShowCreateModal(false)}
            onSaved={handleCreated}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <PurchaseHistoryModal
            purchase={selectedPurchase()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <PurchaseDetailModal
            purchase={detailPurchase()}
            onClose={() => setShowDetailModal(false)}
            onChanged={refetch}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Purchases;
