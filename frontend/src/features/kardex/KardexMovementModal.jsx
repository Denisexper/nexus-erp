import { createSignal, createResource, Show, For } from "solid-js";
import { kardexApi } from "../../services/kardex.api";
import { productsApi } from "../../services/products.api";
import { locationsApi } from "../../services/locations.api";
import { showToast } from "../../utils/toast";

const REASONS = [
  { value: "purchase", label: "Compra" },
  { value: "sale", label: "Venta" },
  { value: "adjustment", label: "Ajuste" },
  { value: "return", label: "Devolución" },
  { value: "initial", label: "Carga inicial" },
];

function KardexMovementModal(props) {
  const [product, setProduct] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [type, setType] = createSignal("in");
  const [reason, setReason] = createSignal("purchase");
  const [quantity, setQuantity] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [products] = createResource(() =>
    productsApi.getAll({ isActive: true, limit: 1000 }),
  );
  const [locations] = createResource(() =>
    locationsApi.getAll({ isActive: true, limit: 1000 }),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await kardexApi.registerMovement({
        product: product(),
        location: location(),
        type: type(),
        reason: reason(),
        quantity: Number(quantity()),
        notes: notes(),
      });
      showToast.success("Movimiento registrado exitosamente");
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
            Registrar movimiento
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Producto *
            </label>
            <Show
              when={!products.loading}
              fallback={
                <div class="input-field bg-gray-100 dark:bg-gray-800">
                  Cargando...
                </div>
              }
            >
              <select
                class="input-field w-full"
                required
                value={product()}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={products()?.data}>
                  {(p) => (
                    <option value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  )}
                </For>
              </select>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicación *
            </label>
            <Show
              when={!locations.loading}
              fallback={
                <div class="input-field bg-gray-100 dark:bg-gray-800">
                  Cargando...
                </div>
              }
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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                class="input-field w-full"
                required
                value={type()}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo *
              </label>
              <select
                class="input-field w-full"
                required
                value={reason()}
                onChange={(e) => setReason(e.target.value)}
              >
                <For each={REASONS}>
                  {(r) => <option value={r.value}>{r.label}</option>}
                </For>
              </select>
            </div>
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
              Observaciones
            </label>
            <textarea
              rows="3"
              class="input-field w-full"
              value={notes()}
              onInput={(e) => setNotes(e.target.value)}
            />
          </div>

          <Show when={error()}>
            <div class="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error()}
            </div>
          </Show>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              class="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading()}
              class="btn-primary flex-1 disabled:opacity-50"
            >
              {loading() ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KardexMovementModal;
