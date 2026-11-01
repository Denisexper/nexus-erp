import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { inventoryTransfersApi } from "../../services/inventoryTransfers.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import TransferFormModal from "./TransferFormModal";
import TransferReceiveModal from "./TransferReceiveModal";
import ReportIncidentModal from "./ReportIncidentModal";

const STATUS_LABELS = {
  preparing: "En preparación",
  in_transit: "En tránsito",
  received: "Recibido",
  incident: "Incidencia",
  resolved: "Resuelto (pérdida)",
};

const STATUS_BADGE_CLASS = {
  preparing: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  in_transit: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  received: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  incident: "bg-coral-50 dark:bg-coral/10 text-coral-600 dark:text-coral",
  resolved: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
};

function InventoryTransfers() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("inventory.transfer")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(15);
  const [statusFilter, setStatusFilter] = createSignal("");

  const [transfers, { refetch }] = createResource(
    () => ({ status: statusFilter(), page: currentPage(), limit: limit() }),
    (params) => inventoryTransfersApi.getAll(params),
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [showReceiveModal, setShowReceiveModal] = createSignal(false);
  const [showIncidentModal, setShowIncidentModal] = createSignal(false);
  const [activeTransfer, setActiveTransfer] = createSignal(null);
  const [actionLoading, setActionLoading] = createSignal(false);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleCreated = () => {
    setShowFormModal(false);
    refetch();
  };

  const dispatch = (transfer) => {
    showToast.confirm(`¿Despachar el traslado ${transfer.transferCode}? Esto descuenta el stock del origen.`, async () => {
      setActionLoading(true);
      try {
        await inventoryTransfersApi.dispatch(transfer.id);
        showToast.success("Traslado despachado correctamente");
        refetch();
      } catch (error) {
        showToast.error(error.message);
      }
      setActionLoading(false);
    });
  };

  const openReceive = (transfer) => {
    setActiveTransfer(transfer);
    setShowReceiveModal(true);
  };

  const openIncident = (transfer) => {
    setActiveTransfer(transfer);
    setShowIncidentModal(true);
  };

  const handleReceived = () => {
    setShowReceiveModal(false);
    refetch();
  };

  const handleIncidentReported = () => {
    setShowIncidentModal(false);
    refetch();
  };

  const resumeFromIncident = (transfer) => {
    showToast.confirm(`¿Reanudar el traslado ${transfer.transferCode}? Vuelve a "En tránsito" tal cual estaba, sin tocar el inventario.`, async () => {
      setActionLoading(true);
      try {
        await inventoryTransfersApi.resolveIncident(transfer.id, { action: "resume" });
        showToast.success("Traslado reanudado correctamente");
        refetch();
      } catch (error) {
        showToast.error(error.message);
      }
      setActionLoading(false);
    });
  };

  const writeOffFromIncident = (transfer) => {
    showToast.confirm(
      `¿Dar por perdida la mercancía del traslado ${transfer.transferCode}? Esto descuenta la existencia y el costo promedio de forma permanente. No se puede deshacer.`,
      async () => {
        setActionLoading(true);
        try {
          await inventoryTransfersApi.resolveIncident(transfer.id, { action: "write_off" });
          showToast.success("Mercancía dada de baja correctamente");
          refetch();
        } catch (error) {
          showToast.error(error.message);
        }
        setActionLoading(false);
      },
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Traslados entre almacenes
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Movimiento de mercancía del almacén de distribución hacia las sucursales
              </p>
            </div>
            <button onClick={() => setShowFormModal(true)} class="btn-primary">
              + Nuevo traslado
            </button>
          </div>

          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Filtros</p>
            <select class="input-field" value={statusFilter()} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <For each={Object.entries(STATUS_LABELS)}>
                {([value, label]) => <option value={value}>{label}</option>}
              </For>
            </select>
          </div>

          <div class="card overflow-hidden p-0">
            <Show when={transfers.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">Cargando traslados...</div>
            </Show>
            <Show when={transfers.error}>
              <div class="p-8 text-center text-red-500">Error al cargar traslados</div>
            </Show>
            <Show when={transfers()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Origen → Destino
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
                  <For each={transfers()?.data}>
                    {(transfer) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {transfer.transferCode}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {transfer.sourceWarehouse?.name} → {transfer.destinationWarehouse?.name}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(transfer.transferDate).toLocaleDateString("es-ES")}
                        </td>
                        <td class="px-6 py-4">
                          <span class={`text-xs px-2 py-1 rounded-md ${STATUS_BADGE_CLASS[transfer.status]}`}>
                            {STATUS_LABELS[transfer.status] || transfer.status}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center justify-end gap-2">
                            <Show when={transfer.status === "preparing"}>
                              <button
                                disabled={actionLoading()}
                                onClick={() => dispatch(transfer)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                              >
                                Despachar
                              </button>
                            </Show>
                            <Show when={transfer.status === "in_transit"}>
                              <button
                                onClick={() => openReceive(transfer)}
                                class="text-xs px-3 py-1.5 rounded-md border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                              >
                                Recibir
                              </button>
                              <button
                                onClick={() => openIncident(transfer)}
                                class="text-xs px-3 py-1.5 rounded-md border border-coral-200 dark:border-coral/30 text-coral-600 dark:text-coral hover:bg-coral-50 dark:hover:bg-coral/10 transition-colors"
                              >
                                Incidencia
                              </button>
                            </Show>
                            <Show when={transfer.status === "incident"}>
                              <button
                                disabled={actionLoading()}
                                onClick={() => resumeFromIncident(transfer)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                              >
                                Reanudar
                              </button>
                              <button
                                disabled={actionLoading()}
                                onClick={() => writeOffFromIncident(transfer)}
                                class="text-xs px-3 py-1.5 rounded-md border border-coral-200 dark:border-coral/30 text-coral-600 dark:text-coral hover:bg-coral-50 dark:hover:bg-coral/10 transition-colors disabled:opacity-50"
                              >
                                Dar por perdida
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>

              <Show when={transfers()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={transfers().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <TransferFormModal onClose={() => setShowFormModal(false)} onSaved={handleCreated} />
        </Show>

        <Show when={showReceiveModal()}>
          <TransferReceiveModal
            transfer={activeTransfer()}
            onClose={() => setShowReceiveModal(false)}
            onSaved={handleReceived}
          />
        </Show>

        <Show when={showIncidentModal()}>
          <ReportIncidentModal
            transfer={activeTransfer()}
            onClose={() => setShowIncidentModal(false)}
            onSaved={handleIncidentReported}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default InventoryTransfers;
