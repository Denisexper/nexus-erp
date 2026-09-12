import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { retaceosApi } from "../../services/retaceos.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";
import RetaceoCreateModal from "./RetaceoCreateModal";
import RetaceoDetailModal from "./RetaceoDetailModal";
import RetaceoHistoryModal from "./RetaceoHistoryModal";

function Retaceos() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("retaceos.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({ search: "", status: "" });

  const [retaceos, { refetch }] = createResource(
    () => ({ ...appliedFilters(), page: currentPage(), limit: limit() }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.status) filters.status = params.status;
      filters.page = params.page;
      filters.limit = params.limit;
      return retaceosApi.getAll(filters);
    },
  );

  const [showCreateModal, setShowCreateModal] = createSignal(false);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedRetaceo, setSelectedRetaceo] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailRetaceo, setDetailRetaceo] = createSignal(null);

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

  const openHistory = (retaceo) => {
    setSelectedRetaceo(retaceo);
    setShowHistoryModal(true);
  };

  const openDetail = (retaceo) => {
    setDetailRetaceo(retaceo);
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
                Retaceos
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Distribución de gastos de importación y costo real por producto
              </p>
            </div>
            <Show when={auth.hasPermission("retaceos.create")}>
              <button onClick={() => setShowCreateModal(true)} class="btn-primary">
                + Registrar retaceo
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
                <option value="registered">Registrado</option>
                <option value="cancelled">Cancelado</option>
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
            <Show when={retaceos.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando retaceos...
              </div>
            </Show>

            <Show when={retaceos.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar retaceos
              </div>
            </Show>

            <Show when={retaceos()}>
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
                      Costo total
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
                  <For each={retaceos()?.data}>
                    {(retaceo) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {retaceo.code}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {retaceo.purchaseOrder?.code || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {retaceo.supplier?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatMoney(retaceo.totalCost)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {retaceo.retaceoDate
                            ? new Date(retaceo.retaceoDate).toLocaleDateString("es-ES")
                            : "-"}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(retaceo.status)}`}
                          >
                            {statusLabel(retaceo.status)}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(retaceo)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(retaceo)}
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

              <Show when={retaceos()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={retaceos().pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showCreateModal()}>
          <RetaceoCreateModal
            onClose={() => setShowCreateModal(false)}
            onSaved={handleCreated}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <RetaceoHistoryModal
            retaceo={selectedRetaceo()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <RetaceoDetailModal
            retaceo={detailRetaceo()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Retaceos;
