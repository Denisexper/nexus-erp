import { createSignal, createResource, Show, For } from "solid-js";
import { inventoryApi } from "../../services/inventory.api";
import { locationsApi } from "../../services/locations.api";
import { showToast } from "../../utils/toast";

// "Asignar a ubicación" (ERS 6.9.12): el único punto donde un lote recién
// recibido pasa a contar como stock real (movimiento + saldo + costo
// promedio, todo en una transacción en el backend).
function AssignLocationModal(props) {
  const remaining = () => (props.lot?.quantityReceived || 0) - (props.lot?.quantityAssigned || 0);

  const [location, setLocation] = createSignal("");
  const [quantity, setQuantity] = createSignal(remaining());
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [locations] = createResource(() => locationsApi.getAll({ isActive: true, limit: 1000 }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await inventoryApi.assignLotToLocation(props.lot.id, {
        location: location(),
        quantity: Number(quantity()),
      });
      showToast.success("Mercancía ubicada correctamente");
      props.onSaved();
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
            Ubicar lote {props.lot?.lotCode}
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div class="bg-gray-50 dark:bg-white/5 rounded-md px-4 py-3 text-sm">
            <p class="text-gray-900 dark:text-white font-medium">{props.lot?.product?.name}</p>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Pendiente de ubicar: {remaining()} de {props.lot?.quantityReceived}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicación *
            </label>
            <Show
              when={!locations.loading}
              fallback={<div class="input-field bg-gray-100 dark:bg-gray-800">Cargando...</div>}
            >
              <select
                class="input-field w-full"
                required
                value={location()}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={locations()?.data}>
                  {(l) => <option value={l._id}>{l.code}</option>}
                </For>
              </select>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad a ubicar *
            </label>
            <input
              type="number"
              min="0.01"
              max={remaining()}
              step="0.01"
              required
              class="input-field w-full"
              value={quantity()}
              onInput={(e) => setQuantity(e.target.value)}
            />
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
              {loading() ? "Guardando..." : "Ubicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignLocationModal;
