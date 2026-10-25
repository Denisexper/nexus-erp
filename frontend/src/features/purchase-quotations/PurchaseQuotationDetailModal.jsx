import { createSignal, createResource, Show, For } from "solid-js";
import { purchaseQuotationsApi } from "../../services/purchaseQuotations.api";
import { purchaseQuotationDocumentsApi } from "../../services/purchaseQuotationDocuments.api";
import { SERVER_URL } from "../../services/http";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";
import PurchaseOrderCreateModal from "../purchase-orders/PurchaseOrderCreateModal";

// Respaldo documental de la cotización (plus-feature de Denis, no está en la
// ERS — ver docs/features/README.md): el PDF/foto que el proveedor devuelve
// cotizado, varios adjuntos por cotización. Calco de ExpenseDocuments en
// PurchaseOrderDetailModal.jsx (misma UI, mismo patrón de upload/remove).
function QuotationDocuments(props) {
  const auth = useAuth();
  const [uploading, setUploading] = createSignal(false);
  let fileInput;

  const [documents, { refetch }] = createResource(
    () => props.quotationId,
    (quotationId) => purchaseQuotationDocumentsApi.getByQuotation(quotationId),
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await purchaseQuotationDocumentsApi.upload(props.quotationId, file);
      showToast.success("Documento cargado correctamente");
      refetch();
    } catch (error) {
      showToast.error(error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (id) => {
    showToast.confirm("¿Eliminar este documento?", async () => {
      try {
        await purchaseQuotationDocumentsApi.remove(id);
        showToast.success("Documento eliminado correctamente");
        refetch();
      } catch (error) {
        showToast.error(error.message);
      }
    });
  };

  return (
    <div class="mt-1.5 space-y-1.5">
      <div class="flex flex-wrap items-center gap-2">
        <For each={documents()?.data}>
          {(doc) => (
            <span class="inline-flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-white/5 rounded-md px-2 py-1">
              <a
                href={`${SERVER_URL}/uploads/${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                class="text-blue-600 dark:text-blue-400 hover:underline"
              >
                📎 {doc.fileName}
              </a>
              <Show when={auth.hasPermission("purchase_quotation_documents.delete")}>
                <button
                  type="button"
                  onClick={() => removeDocument(doc._id)}
                  class="text-gray-400 hover:text-coral-600 dark:hover:text-coral"
                >
                  ✕
                </button>
              </Show>
            </span>
          )}
        </For>
        <Show when={documents() && documents().data.length === 0}>
          <p class="text-xs text-gray-500 dark:text-night-400">Sin documentos adjuntos.</p>
        </Show>
      </div>
      <Show when={auth.hasPermission("purchase_quotation_documents.upload")}>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          class="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInput.click()}
          disabled={uploading()}
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {uploading() ? "Cargando..." : "+ Adjuntar documento"}
        </button>
      </Show>
    </div>
  );
}

function PurchaseQuotationDetailModal(props) {
  const auth = useAuth();

  const [showOrderModal, setShowOrderModal] = createSignal(false);

  const [detail, { refetch }] = createResource(
    () => props.purchaseQuotation?._id,
    (id) => purchaseQuotationsApi.getById(id),
  );
  const quotation = () => detail()?.data;

  const [actionLoading, setActionLoading] = createSignal(false);

  const notifyChanged = () => {
    refetch();
    props.onChanged?.();
  };

  const runAction = (label, action, confirmMsg) => {
    showToast.confirm(confirmMsg, async () => {
      setActionLoading(true);
      try {
        await action();
        notifyChanged();
        showToast.success(label);
      } catch (error) {
        showToast.error(error.message);
      }
      setActionLoading(false);
    });
  };

  const reject = () =>
    runAction(
      "Cotización rechazada correctamente",
      () => purchaseQuotationsApi.reject(quotation()._id),
      "¿Rechazar esta cotización?",
    );

  const cancel = () =>
    runAction(
      "Cotización cancelada correctamente",
      () => purchaseQuotationsApi.cancel(quotation()._id),
      "¿Cancelar esta cotización? Esta acción no se puede deshacer.",
    );

  const handleOrderSaved = () => {
    setShowOrderModal(false);
    notifyChanged();
  };

  return (
    <>
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={quotation()?.code}
      subtitle={quotation() && statusLabel(quotation().status)}
      avatar={quotation() && <DetailAvatar fallback="CT" />}
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Proveedor" value={quotation()?.supplier?.name} />
        <DetailField label="Registrada por" value={quotation()?.user?.name} />
        <DetailField
          label="Fecha de cotización"
          value={
            quotation()?.quotationDate &&
            new Date(quotation().quotationDate).toLocaleDateString("es-ES")
          }
        />
        <DetailField
          label="Vigencia"
          value={
            quotation()?.validUntil &&
            new Date(quotation().validUntil).toLocaleDateString("es-ES")
          }
        />
        <DetailField label="Condiciones de pago" value={quotation()?.paymentTerms} />
        <DetailField label="Días de entrega" value={quotation()?.deliveryDays} />
        <DetailField
          label="Estado"
          value={
            <span
              class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(quotation()?.status)}`}
            >
              {statusLabel(quotation()?.status)}
            </span>
          }
        />
        <DetailField label="Notas" full value={quotation()?.notes} />
      </DetailSection>

      <DetailSection title="Acciones" cols={1} divider>
        <div class="flex flex-wrap gap-2">
          <Show when={quotation()?.status === "received" && auth.hasPermission("purchase_orders.create")}>
            <button onClick={() => setShowOrderModal(true)} class="text-xs px-3 py-1.5 rounded-md border border-mint-600/30 text-mint-700 dark:text-mint hover:bg-mint-600/10 transition-colors">
              Generar orden de compra
            </button>
          </Show>
          <Show when={quotation()?.status === "received" && auth.hasPermission("purchase_quotations.reject")}>
            <button disabled={actionLoading()} onClick={reject} class="text-xs px-3 py-1.5 rounded-md border border-coral-200 dark:border-coral/30 text-coral-600 dark:text-coral hover:bg-coral-50 dark:hover:bg-coral/10 transition-colors disabled:opacity-50">
              Rechazar
            </button>
          </Show>
          <Show
            when={
              ["received", "rejected"].includes(quotation()?.status) &&
              auth.hasPermission("purchase_quotations.cancel")
            }
          >
            <button disabled={actionLoading()} onClick={cancel} class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50">
              Cancelar cotización
            </button>
          </Show>
          <Show when={!["received", "rejected"].includes(quotation()?.status)}>
            <p class="text-xs text-gray-500 dark:text-night-400">
              No hay acciones disponibles para este estado.
            </p>
          </Show>
        </div>
      </DetailSection>

      <DetailSection title="Productos cotizados" cols={1} divider>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                <th class="px-1 py-2">Producto</th>
                <th class="px-1 py-2">Cantidad</th>
                <th class="px-1 py-2">Unidad</th>
                <th class="px-1 py-2">Precio unit.</th>
                <th class="px-1 py-2">Impuesto</th>
                <th class="px-1 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <For each={quotation()?.details}>
                {(line) => (
                  <tr class="border-t border-gray-100 dark:border-white/5">
                    <td class="px-1 py-2 text-[#29343E] dark:text-white font-medium">
                      {line.product?.name || "-"}
                    </td>
                    <td class="px-1 py-2">{line.quantity}</td>
                    <td class="px-1 py-2">{line.unit?.name || "-"}</td>
                    <td class="px-1 py-2">{formatMoney(line.unitPrice, quotation()?.currency)}</td>
                    <td class="px-1 py-2">{line.taxRate}%</td>
                    <td class="px-1 py-2 font-medium">{formatMoney(line.total, quotation()?.currency)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={quotation()?.expenses?.length > 0}>
          <div class="pt-3">
            <p class="text-xs font-semibold text-gray-500 dark:text-night-400 uppercase tracking-wider mb-2">
              Gastos adicionales
            </p>
            <div class="space-y-1">
              <For each={quotation()?.expenses}>
                {(expense) => (
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-night-300">
                      {expense.expenseType?.name || "-"}
                      <Show when={expense.description}> — {expense.description}</Show>
                    </span>
                    <span class="font-medium text-[#29343E] dark:text-white">
                      {formatMoney(expense.amount, quotation()?.currency)}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <div class="pt-3 border-t border-gray-100 dark:border-white/5 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Subtotal</span>
            <span>{formatMoney(quotation()?.subtotal, quotation()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Impuestos</span>
            <span>{formatMoney(quotation()?.tax, quotation()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Gastos adicionales</span>
            <span>{formatMoney(quotation()?.additionalExpenses, quotation()?.currency)}</span>
          </div>
          <div class="flex justify-between font-semibold text-[#29343E] dark:text-white pt-1">
            <span>Total</span>
            <span>{formatMoney(quotation()?.total, quotation()?.currency)}</span>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Documentos adjuntos" cols={1} divider>
        <p class="text-xs text-gray-500 dark:text-night-400 mb-1">
          Respaldo documental de la cotización (PDF o foto que mandó el proveedor). Los precios y condiciones siguen siendo los que se tipearon arriba.
        </p>
        <Show when={quotation()}>
          <QuotationDocuments quotationId={quotation()._id} />
        </Show>
      </DetailSection>
    </DetailModal>

    <Show when={showOrderModal()}>
      <PurchaseOrderCreateModal
        presetQuotation={quotation()}
        onClose={() => setShowOrderModal(false)}
        onSaved={handleOrderSaved}
      />
    </Show>
    </>
  );
}

export default PurchaseQuotationDetailModal;
