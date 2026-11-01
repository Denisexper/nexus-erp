import { createSignal, createResource, Show, For } from "solid-js";
import { inventoryApi } from "../../services/inventory.api";
import { locationsApi } from "../../services/locations.api";
import { showToast } from "../../utils/toast";

// Ajuste/devolución manual (ERS RN-INV-012, Fase 5): la única vía para
// corregir existencias por fuera de compras/traslados — conteo físico,
// daño, devolución de cliente aceptada. Una salida (decrease) SÍ puede
// fallar si no hay suficiente stock en esa ubicación (RN-INV-001).
function AdjustmentFormModal(props) {
  const [location, setLocation] = createSignal("");
  const [direction, setDirection] = createSignal("decrease");
  const [movementType, setMovementType] = createSignal("adjustment");
  const [quantity, setQuantity] = createSignal("");
  const [reason, setReason] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [locations] = createResource(() => locationsApi.getAll({ type: "storage", isActive: true, limit: 1000 }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await inventoryApi.adjustLot(props.lot.id, {
        location: location(),
        quantity: Number(quantity()),
        direction: direction(),
        movementType: direction() === "increase" ? movementType() : "adjustment",
        reason: reason(),
      });
      showToast.success("Ajuste registrado correctamente");
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
            Ajuste — {props.lot?.lotCode}
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div class="bg-gray-50 dark:bg-white/5 rounded-md px-4 py-3 text-sm">
            <p class="text-gray-900 dark:text-white font-medium">{props.lot?.product?.name}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de ajuste *
              </label>
              <select class="input-field w-full" value={direction()} onChange={(e) => setDirection(e.target.value)}>
                <option value="decrease">Salida (reduce existencia)</option>
                <option value="increase">Entrada (aumenta existencia)</option>
              </select>
            </div>
            <Show when={direction() === "increase"}>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de entrada
                </label>
                <select class="input-field w-full" value={movementType()} onChange={(e) => setMovementType(e.target.value)}>
                  <option value="adjustment">Ajuste (conteo físico)</option>
                  <option value="return">Devolución de cliente</option>
                </select>
              </div>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicación *
            </label>
            <Show
              when={!locations.loading}
              fallback={<div class="input-field bg-gray-100 dark:bg-gray-800">Cargando...</div>}
            >
              <select class="input-field w-full" required value={location()} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Selecciona...</option>
                <For each={locations()?.data}>{(l) => <option value={l._id}>{l.code}</option>}</For>
              </select>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              class="input-field w-full"
              value={quantity()}
              onInput={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo *
            </label>
            <textarea
              rows="2"
              required
              class="input-field w-full"
              placeholder="Ej. Conteo físico encontró diferencia, producto dañado, devolución aceptada..."
              value={reason()}
              onInput={(e) => setReason(e.target.value)}
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
              {loading() ? "Guardando..." : "Registrar ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdjustmentFormModal;
