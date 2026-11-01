import { createSignal, createResource, Show, For } from "solid-js";
import { inventoryLabelPrintsApi } from "../../services/inventoryLabelPrints.api";
import { showToast } from "../../utils/toast";

// RN-INV-016/017 del ERS: el backend decide solo si es impresión o
// reimpresión según el historial del lote — acá solo reflejamos eso para
// pedir el motivo cuando corresponde.
function LabelPrintModal(props) {
  const [quantity, setQuantity] = createSignal(props.lot?.quantityReceived || 1);
  const [reprintReason, setReprintReason] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [history, { refetch }] = createResource(
    () => props.lot?.id,
    (lotId) => inventoryLabelPrintsApi.getByLot(lotId),
  );
  const isReprint = () => (history()?.data?.length || 0) > 0;

  // Mismo patrón de descarga que el PDF de solicitud de cotización:
  // blob -> object URL -> <a download> temporal.
  const downloadPdf = async (labelPrintId) => {
    try {
      const blob = await inventoryLabelPrintsApi.getPdf(labelPrintId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiquetas_${props.lot?.lotCode}_${labelPrintId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast.error(err.message || "Error al generar el PDF de etiquetas");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await inventoryLabelPrintsApi.print({
        inventoryLot: props.lot.id,
        quantityPrinted: Number(quantity()),
        reprintReason: isReprint() ? reprintReason() : undefined,
      });
      showToast.success(isReprint() ? "Etiqueta reimpresa correctamente" : "Etiqueta impresa correctamente");
      setReprintReason("");
      refetch();
      props.onSaved?.();
      await downloadPdf(result.newLabelPrint.id);
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Etiquetas — {props.lot?.lotCode}
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div class="p-6 space-y-5 overflow-y-auto">
          <div class="bg-gray-50 dark:bg-white/5 rounded-md px-4 py-3 text-sm">
            <p class="text-gray-900 dark:text-white font-medium">{props.lot?.product?.name}</p>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Código interno: {props.lot?.product?.internalCode || "-"}
            </p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad de etiquetas *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                class="input-field w-full"
                value={quantity()}
                onInput={(e) => setQuantity(e.target.value)}
              />
            </div>

            <Show when={isReprint()}>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la reimpresión *
                </label>
                <input
                  type="text"
                  required
                  class="input-field w-full"
                  placeholder="Ej. Etiqueta dañada, se perdió, ilegible..."
                  value={reprintReason()}
                  onInput={(e) => setReprintReason(e.target.value)}
                />
              </div>
            </Show>

            <Show when={error()}>
              <div class="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error()}
              </div>
            </Show>

            <button type="submit" disabled={loading()} class="btn-primary w-full disabled:opacity-50">
              {loading() ? "Imprimiendo..." : isReprint() ? "Reimprimir" : "Imprimir"}
            </button>
          </form>

          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historial de impresiones</p>
            <Show when={history.loading}>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
            </Show>
            <Show when={history() && history().data.length === 0}>
              <p class="text-sm text-gray-500 dark:text-gray-400">Todavía no se ha impreso ninguna etiqueta de este lote.</p>
            </Show>
            <div class="space-y-2">
              <For each={history()?.data}>
                {(print) => (
                  <div class="border border-gray-200 dark:border-gray-800 rounded-md px-3 py-2 text-sm">
                    <div class="flex justify-between items-start">
                      <span class="text-gray-900 dark:text-white font-medium">
                        {print.quantityPrinted} etiqueta(s)
                      </span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(print.printDate).toLocaleString("es-ES")}
                      </span>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {print.user?.name || "-"}
                    </p>
                    <Show when={print.reprintReason}>
                      <p class="text-amber-600 dark:text-amber-400 text-xs mt-1">
                        Motivo: {print.reprintReason}
                      </p>
                    </Show>
                    <button
                      type="button"
                      onClick={() => downloadPdf(print.id)}
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      Descargar PDF
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabelPrintModal;
