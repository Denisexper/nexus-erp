import { createSignal, createEffect, Show, For } from "solid-js";
import { inventoryTransfersApi } from "../../services/inventoryTransfers.api";
import { showToast } from "../../utils/toast";

// Recibir (ERS 6.9.19): por defecto llega lo mismo que se despachó; si se
// reduce alguna cantidad, el backend registra automáticamente un ajuste
// compensatorio por la merma (ver receiveTransfer.js).
function TransferReceiveModal(props) {
  const [quantities, setQuantities] = createSignal({});
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  createEffect(() => {
    const initial = {};
    for (const detail of props.transfer?.details || []) {
      initial[detail.id] = detail.quantityDispatched;
    }
    setQuantities(initial);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await inventoryTransfersApi.receive(props.transfer.id, {
        receipts: Object.entries(quantities()).map(([detailId, quantityReceived]) => ({
          detailId,
          quantityReceived: Number(quantityReceived),
        })),
      });
      showToast.success("Traslado recibido correctamente");
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recibir traslado {props.transfer?.transferCode}
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Confirma la cantidad realmente recibida de cada producto. Si llega menos de lo despachado, el sistema registra automáticamente el faltante como ajuste.
          </p>

          <div class="space-y-2">
            <For each={props.transfer?.details}>
              {(detail) => (
                <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{detail.product?.name}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Despachado: {detail.quantityDispatched} · {detail.sourceLocation?.code} → {detail.destinationLocation?.code}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={detail.quantityDispatched}
                    step="0.01"
                    required
                    class="input-field w-28 text-sm"
                    value={quantities()[detail.id] ?? ""}
                    onInput={(e) => setQuantities((prev) => ({ ...prev, [detail.id]: e.target.value }))}
                  />
                </div>
              )}
            </For>
          </div>

          <Show when={error()}>
            <div class="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error()}
            </div>
          </Show>

          <div class="flex gap-3 pt-2">
            <button type="button" onClick={props.onClose} class="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading()} class="btn-primary flex-1 disabled:opacity-50">
              {loading() ? "Guardando..." : "Confirmar recepción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferReceiveModal;
