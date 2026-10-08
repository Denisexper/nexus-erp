import { createSignal, createResource, createMemo, Show, For } from "solid-js";
import { purchaseRequestDetailsApi } from "../../services/purchaseRequestDetails.api";
import PurchaseQuotationCreateModal from "../purchase-quotations/PurchaseQuotationCreateModal";
import PurchaseQuotationComparisonModal from "../purchase-quotations/PurchaseQuotationComparisonModal";

// Junta las líneas de varias solicitudes a la vez para que Compras pueda
// analizarlas antes de decidir cómo cotizar/ordenar (pedido de Denis tras la
// demo: hoy solo se podía revisar una solicitud por una). Agrupa por
// producto+unidad y muestra de qué solicitud viene cada cantidad.
const fetchLinesForRequests = async (requests) => {
  const results = await Promise.all(
    requests.map((r) => purchaseRequestDetailsApi.getAll({ purchaseRequest: r._id, limit: 1000 })),
  );
  return requests.map((request, i) => ({ request, lines: results[i]?.data || [] }));
};

function PurchaseRequestConsolidatedModal(props) {
  const [groups] = createResource(() => props.requests, fetchLinesForRequests);
  const [showQuotationModal, setShowQuotationModal] = createSignal(false);
  const [showComparisonModal, setShowComparisonModal] = createSignal(false);

  const handleQuotationSaved = () => {
    setShowQuotationModal(false);
    props.onQuotationCreated?.();
  };

  const consolidated = createMemo(() => {
    const data = groups();
    if (!data) return [];

    const byKey = new Map();
    for (const { request, lines } of data) {
      for (const line of lines) {
        const productId = line.product?._id || line.product;
        const unitId = line.unit?._id || line.unit;
        const key = `${productId}__${unitId}`;

        if (!byKey.has(key)) {
          byKey.set(key, {
            productName: line.product?.name || "-",
            unitName: line.unit?.name || "-",
            totalQuantity: 0,
            breakdown: [],
          });
        }

        const entry = byKey.get(key);
        entry.totalQuantity += Number(line.quantity || 0);
        entry.breakdown.push({ requestCode: request.code, quantity: line.quantity });
      }
    }

    return Array.from(byKey.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  });

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-4xl shadow-xl max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Consolidado de solicitudes de compra
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {props.requests.length} solicitudes seleccionadas
            </p>
          </div>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-auto p-6 space-y-4">
          <div class="flex flex-wrap gap-1.5">
            <For each={props.requests}>
              {(r) => (
                <span class="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                  {r.code}
                </span>
              )}
            </For>
          </div>

          <Show when={groups.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">Cargando productos...</div>
          </Show>

          <Show when={groups.error}>
            <div class="text-center py-8 text-red-500">Error al cargar las solicitudes seleccionadas</div>
          </Show>

          <Show when={groups() && consolidated().length === 0}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Las solicitudes seleccionadas no tienen productos.
            </div>
          </Show>

          <Show when={consolidated().length > 0}>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th class="py-2">Producto</th>
                  <th class="py-2">Unidad</th>
                  <th class="py-2">Cantidad total</th>
                  <th class="py-2">Solicitudes de origen</th>
                </tr>
              </thead>
              <tbody>
                <For each={consolidated()}>
                  {(group) => (
                    <tr class="border-b border-gray-100 dark:border-white/5">
                      <td class="py-2 font-medium text-gray-900 dark:text-white">{group.productName}</td>
                      <td class="py-2 text-gray-600 dark:text-gray-300">{group.unitName}</td>
                      <td class="py-2 text-gray-600 dark:text-gray-300">{group.totalQuantity}</td>
                      <td class="py-2">
                        <div class="flex flex-wrap gap-1">
                          <For each={group.breakdown}>
                            {(b) => (
                              <span class="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                {b.requestCode} · {b.quantity}
                              </span>
                            )}
                          </For>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button onClick={props.onClose} class="btn-secondary flex-1">
            Cerrar
          </button>
          <Show when={consolidated().length > 0}>
            <button onClick={() => setShowComparisonModal(true)} class="btn-secondary flex-1">
              Comparar cotizaciones
            </button>
            <button onClick={() => setShowQuotationModal(true)} class="btn-primary flex-1">
              Crear cotización con estas solicitudes
            </button>
          </Show>
        </div>
      </div>

      <Show when={showQuotationModal()}>
        <PurchaseQuotationCreateModal
          presetRequests={props.requests}
          onClose={() => setShowQuotationModal(false)}
          onSaved={handleQuotationSaved}
        />
      </Show>

      <Show when={showComparisonModal()}>
        <PurchaseQuotationComparisonModal
          purchaseRequestIds={props.requests.map((r) => r._id)}
          requestCodes={props.requests.map((r) => r.code)}
          onClose={() => setShowComparisonModal(false)}
        />
      </Show>
    </div>
  );
}

export default PurchaseRequestConsolidatedModal;
