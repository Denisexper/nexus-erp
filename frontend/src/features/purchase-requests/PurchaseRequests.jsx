import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { purchaseRequestsApi } from "../../services/purchaseRequests.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { statusLabel, statusBadgeClass } from "./statusMeta";
import PurchaseRequestFormModal from "./PurchaseRequestFormModal";
import PurchaseRequestDetailModal from "./PurchaseRequestDetailModal";
import PurchaseRequestHistoryModal from "./PurchaseRequestHistoryModal";

function PurchaseRequests() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("purchase_requests.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    status: "",
  });

  const [purchaseRequests, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.status) filters.status = params.status;
      filters.page = params.page;
      filters.limit = params.limit;
      return purchaseRequestsApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingPurchaseRequest, setEditingPurchaseRequest] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailPurchaseRequest, setDetailPurchaseRequest] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      status: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", status: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingPurchaseRequest(null);
    setShowFormModal(true);
  };

  const openEdit = (purchaseRequest) => {
    setEditingPurchaseRequest(purchaseRequest);
    setShowFormModal(true);
  };

  const openHistory = (purchaseRequest) => {
    setSelectedPurchaseRequest(purchaseRequest);
    setShowHistoryModal(true);
  };

  const openDetail = (purchaseRequest) => {
    setDetailPurchaseRequest(purchaseRequest);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const handleDetailChanged = () => {
    refetch();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Solicitudes de compra
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Necesidades internas de abastecimiento, primer paso del flujo de Compras
              </p>
            </div>
            <Show when={auth.hasPermission("purchase_requests.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nueva solicitud
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
                <option value="submitted">Enviada</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
                <option value="cancelled">Cancelada</option>
                <option value="partially_quoted">Parcialmente cotizada</option>
                <option value="quoted">Cotizada</option>
                <option value="partially_ordered">Parcialmente ordenada</option>
                <option value="completed">Completada</option>
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
            <Show when={purchaseRequests.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando solicitudes de compra...
              </div>
            </Show>

            <Show when={purchaseRequests.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar solicitudes de compra
              </div>
            </Show>

            <Show when={purchaseRequests()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sucursal / Almacén
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha solicitud
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={purchaseRequests()?.data}>
                    {(purchaseRequest) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {purchaseRequest.code}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {purchaseRequest.branch?.name || "-"} /{" "}
                          {purchaseRequest.warehouse?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {purchaseRequest.requestDate
                            ? new Date(purchaseRequest.requestDate).toLocaleDateString("es-ES")
                            : "-"}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(purchaseRequest.status)}`}
                          >
                            {statusLabel(purchaseRequest.status)}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(purchaseRequest)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(purchaseRequest)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show
                              when={
                                purchaseRequest.status === "draft" &&
                                auth.hasPermission("purchase_requests.update")
                              }
                            >
                              <button
                                onClick={() => openEdit(purchaseRequest)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>

              <Show when={purchaseRequests()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={purchaseRequests().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <PurchaseRequestFormModal
            purchaseRequest={editingPurchaseRequest()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <PurchaseRequestHistoryModal
            purchaseRequest={selectedPurchaseRequest()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <PurchaseRequestDetailModal
            purchaseRequest={detailPurchaseRequest()}
            onClose={() => setShowDetailModal(false)}
            onChanged={handleDetailChanged}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default PurchaseRequests;
