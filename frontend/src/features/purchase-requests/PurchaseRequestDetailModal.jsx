import { createSignal, createResource, Show, For } from "solid-js";
import { purchaseRequestsApi } from "../../services/purchaseRequests.api";
import { purchaseRequestDetailsApi } from "../../services/purchaseRequestDetails.api";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";
import { statusLabel, statusBadgeClass } from "./statusMeta";
import PurchaseRequestLineFormModal from "./PurchaseRequestLineFormModal";
import PurchaseQuotationComparisonModal from "../purchase-quotations/PurchaseQuotationComparisonModal";

// Estados en los que ya existe al menos una cotización registrada contra
// esta solicitud (ver createPurchaseQuotation.js en el backend).
const QUOTED_STATUSES = ["partially_quoted", "quoted", "partially_ordered", "completed"];

function PurchaseRequestDetailModal(props) {
  const auth = useAuth();

  const [detail, { refetch: refetchDetail }] = createResource(
    () => props.purchaseRequest?._id,
    (id) => purchaseRequestsApi.getById(id),
  );
  const purchaseRequest = () => detail()?.data;

  const [lines, { refetch: refetchLines }] = createResource(
    () => props.purchaseRequest?._id,
    (id) => purchaseRequestDetailsApi.getAll({ purchaseRequest: id, limit: 100 }),
  );

  const [showLineModal, setShowLineModal] = createSignal(false);
  const [editingLine, setEditingLine] = createSignal(null);
  const [actionLoading, setActionLoading] = createSignal(false);
  const [showComparisonModal, setShowComparisonModal] = createSignal(false);

  const isDraft = () => purchaseRequest()?.status === "draft";

  const notifyChanged = () => {
    refetchDetail();
    props.onChanged?.();
  };

  const openAddLine = () => {
    setEditingLine(null);
    setShowLineModal(true);
  };

  const openEditLine = (line) => {
    setEditingLine(line);
    setShowLineModal(true);
  };

  const handleLineSaved = () => {
    setShowLineModal(false);
    refetchLines();
  };

  const deleteLine = (line) => {
    showToast.confirm(
      `¿Eliminar la línea de ${line.product?.name || "este producto"}?`,
      async () => {
        try {
          await purchaseRequestDetailsApi.delete(line._id);
          refetchLines();
          showToast.success("Línea eliminada correctamente");
        } catch (error) {
          showToast.error(error.message);
        }
      },
    );
  };

  const runAction = async (label, action, confirmMsg) => {
    const doAction = async () => {
      setActionLoading(true);
      try {
        await action();
        notifyChanged();
        showToast.success(label);
      } catch (error) {
        showToast.error(error.message);
      }
      setActionLoading(false);
    };

    if (confirmMsg) {
      showToast.confirm(confirmMsg, doAction);
    } else {
      await doAction();
    }
  };

  const submit = () =>
    runAction(
      "Solicitud enviada correctamente",
      () => purchaseRequestsApi.submit(purchaseRequest()._id),
      "¿Enviar esta solicitud? Ya no podrás editar sus líneas.",
    );

  const approve = () =>
    runAction(
      "Solicitud aprobada correctamente",
      () => purchaseRequestsApi.approve(purchaseRequest()._id),
      "¿Aprobar esta solicitud?",
    );

  const reject = () =>
    runAction(
      "Solicitud rechazada correctamente",
      () => purchaseRequestsApi.reject(purchaseRequest()._id),
      "¿Rechazar esta solicitud?",
    );

  const cancel = () =>
    runAction(
      "Solicitud cancelada correctamente",
      () => purchaseRequestsApi.cancel(purchaseRequest()._id),
      "¿Cancelar esta solicitud? Esta acción no se puede deshacer.",
    );

  return (
    <>
      <DetailModal
        onClose={props.onClose}
        loading={detail.loading}
        error={detail.error}
        title={purchaseRequest()?.code}
        subtitle={purchaseRequest() && statusLabel(purchaseRequest().status)}
        avatar={
          purchaseRequest() && <DetailAvatar fallback="SC" />
        }
      >
        <DetailSection title="Información general" cols={2}>
          <DetailField label="Sucursal" value={purchaseRequest()?.branch?.name} />
          <DetailField label="Almacén" value={purchaseRequest()?.warehouse?.name} />
          <DetailField label="Solicitado por" value={purchaseRequest()?.user?.name} />
          <DetailField
            label="Fecha de solicitud"
            value={
              purchaseRequest()?.requestDate &&
              new Date(purchaseRequest().requestDate).toLocaleDateString("es-ES")
            }
          />
          <DetailField
            label="Fecha requerida"
            value={
              purchaseRequest()?.requiredDate &&
              new Date(purchaseRequest().requiredDate).toLocaleDateString("es-ES")
            }
          />
          <DetailField
            label="Estado"
            value={
              <span
                class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(purchaseRequest()?.status)}`}
              >
                {statusLabel(purchaseRequest()?.status)}
              </span>
            }
          />
          <DetailField label="Justificación" full value={purchaseRequest()?.justification} />
          <DetailField label="Notas" full value={purchaseRequest()?.notes} />
        </DetailSection>

        <DetailSection title="Acciones" cols={1} divider>
          <div class="flex flex-wrap gap-2">
            <Show when={purchaseRequest()?.status === "draft" && auth.hasPermission("purchase_requests.submit")}>
              <button disabled={actionLoading()} onClick={submit} class="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                Enviar solicitud
              </button>
            </Show>
            <Show when={purchaseRequest()?.status === "submitted" && auth.hasPermission("purchase_requests.approve")}>
              <button disabled={actionLoading()} onClick={approve} class="text-xs px-3 py-1.5 rounded-md border border-mint-600/30 text-mint-700 dark:text-mint hover:bg-mint-600/10 transition-colors disabled:opacity-50">
                Aprobar
              </button>
            </Show>
            <Show when={purchaseRequest()?.status === "submitted" && auth.hasPermission("purchase_requests.reject")}>
              <button disabled={actionLoading()} onClick={reject} class="text-xs px-3 py-1.5 rounded-md border border-coral-200 dark:border-coral/30 text-coral-600 dark:text-coral hover:bg-coral-50 dark:hover:bg-coral/10 transition-colors disabled:opacity-50">
                Rechazar
              </button>
            </Show>
            <Show
              when={
                ["draft", "submitted", "approved"].includes(purchaseRequest()?.status) &&
                auth.hasPermission("purchase_requests.cancel")
              }
            >
              <button disabled={actionLoading()} onClick={cancel} class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50">
                Cancelar solicitud
              </button>
            </Show>
            <Show when={QUOTED_STATUSES.includes(purchaseRequest()?.status) && auth.hasPermission("purchase_quotations.view")}>
              <button onClick={() => setShowComparisonModal(true)} class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                Ver cotizaciones
              </button>
            </Show>
            <Show
              when={
                !["draft", "submitted", "approved"].includes(purchaseRequest()?.status) &&
                !(QUOTED_STATUSES.includes(purchaseRequest()?.status) && auth.hasPermission("purchase_quotations.view"))
              }
            >
              <p class="text-xs text-gray-500 dark:text-night-400">
                No hay acciones disponibles para este estado.
              </p>
            </Show>
          </div>
        </DetailSection>

        <DetailSection title="Productos solicitados" cols={1} divider>
          <div class="space-y-3">
            <Show when={isDraft() && auth.hasPermission("purchase_request_details.create")}>
              <button onClick={openAddLine} class="btn-secondary text-xs px-3 py-1.5">
                + Agregar producto
              </button>
            </Show>

            <Show when={lines.loading}>
              <p class="text-sm text-gray-500 dark:text-night-400">Cargando líneas...</p>
            </Show>

            <Show when={lines() && lines().data.length === 0}>
              <p class="text-sm text-gray-500 dark:text-night-400">
                Todavía no se han agregado productos a esta solicitud.
              </p>
            </Show>

            <Show when={lines() && lines().data.length > 0}>
              <div class="overflow-x-auto -mx-1">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                      <th class="px-1 py-2">Producto</th>
                      <th class="px-1 py-2">Cantidad</th>
                      <th class="px-1 py-2">Unidad</th>
                      <th class="px-1 py-2">Descripción</th>
                      <th class="px-1 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={lines()?.data}>
                      {(line) => (
                        <tr class="border-t border-gray-100 dark:border-white/5">
                          <td class="px-1 py-2 text-[#29343E] dark:text-white font-medium">
                            {line.product?.name || "-"}
                          </td>
                          <td class="px-1 py-2">{line.quantity}</td>
                          <td class="px-1 py-2">{line.unit?.name || "-"}</td>
                          <td class="px-1 py-2 text-gray-600 dark:text-night-300">
                            {line.description || "-"}
                          </td>
                          <td class="px-1 py-2">
                            <Show when={isDraft()}>
                              <div class="flex gap-2 justify-end">
                                <Show when={auth.hasPermission("purchase_request_details.update")}>
                                  <button
                                    onClick={() => openEditLine(line)}
                                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Editar
                                  </button>
                                </Show>
                                <Show when={auth.hasPermission("purchase_request_details.delete")}>
                                  <button
                                    onClick={() => deleteLine(line)}
                                    class="text-xs text-coral-600 dark:text-coral hover:underline"
                                  >
                                    Eliminar
                                  </button>
                                </Show>
                              </div>
                            </Show>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </DetailSection>
      </DetailModal>

      <Show when={showLineModal()}>
        <PurchaseRequestLineFormModal
          purchaseRequestId={purchaseRequest()?._id}
          line={editingLine()}
          onClose={() => setShowLineModal(false)}
          onSaved={handleLineSaved}
        />
      </Show>

      <Show when={showComparisonModal()}>
        <PurchaseQuotationComparisonModal
          purchaseRequestId={purchaseRequest()?._id}
          requestCode={purchaseRequest()?.code}
          onClose={() => setShowComparisonModal(false)}
        />
      </Show>
    </>
  );
}

export default PurchaseRequestDetailModal;
