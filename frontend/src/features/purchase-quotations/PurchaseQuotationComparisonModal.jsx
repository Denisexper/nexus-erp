import { createResource, Show, For } from "solid-js";
import { purchaseQuotationsApi } from "../../services/purchaseQuotations.api";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";

// Pantalla de comparación (ERS 6.8.24): cotizaciones lado a lado para una
// misma solicitud. A propósito NO resalta "la más barata" como mejor opción
// automáticamente (CA-COM del ERS lo advierte explícito) — solo muestra los
// datos para que el comprador decida.
function PurchaseQuotationComparisonModal(props) {
  const [comparison] = createResource(
    () => props.purchaseRequestId,
    (id) => purchaseQuotationsApi.getComparison(id),
  );

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-5xl shadow-xl max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Comparación de cotizaciones
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{props.requestCode}</p>
          </div>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-auto p-6">
          <Show when={comparison.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">Cargando cotizaciones...</div>
          </Show>

          <Show when={comparison.error}>
            <div class="text-center py-8 text-red-500">Error al cargar la comparación</div>
          </Show>

          <Show when={comparison() && comparison().data.length === 0}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Todavía no hay cotizaciones registradas para esta solicitud.
            </div>
          </Show>

          <Show when={comparison() && comparison().data.length > 0}>
            <div class="grid gap-4" style={{ "grid-template-columns": `repeat(${comparison().data.length}, minmax(220px, 1fr))` }}>
              <For each={comparison().data}>
                {(entry) => (
                  <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                          {entry.quotation.supplier?.name}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{entry.quotation.code}</p>
                      </div>
                      <span class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(entry.quotation.status)}`}>
                        {statusLabel(entry.quotation.status)}
                      </span>
                    </div>

                    <div class="space-y-1 text-sm">
                      <For each={entry.lines}>
                        {(line) => (
                          <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">
                              {line.product?.name} ({line.quantity} {line.unit?.name})
                            </span>
                            <span class="font-medium">{formatMoney(line.unitPrice, entry.quotation.currency)}</span>
                          </div>
                        )}
                      </For>
                    </div>

                    <div class="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1 text-sm">
                      <div class="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Días de entrega</span>
                        <span>{entry.quotation.deliveryDays ?? "-"}</span>
                      </div>
                      <div class="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Condiciones</span>
                        <span>{entry.quotation.paymentTerms || "-"}</span>
                      </div>
                      <div class="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Vigencia</span>
                        <span>
                          {entry.quotation.validUntil
                            ? new Date(entry.quotation.validUntil).toLocaleDateString("es-ES")
                            : "-"}
                        </span>
                      </div>
                      <div class="flex justify-between font-semibold text-[#29343E] dark:text-white pt-1">
                        <span>Total</span>
                        <span>{formatMoney(entry.quotation.total, entry.quotation.currency)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={props.onClose} class="btn-secondary w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseQuotationComparisonModal;
