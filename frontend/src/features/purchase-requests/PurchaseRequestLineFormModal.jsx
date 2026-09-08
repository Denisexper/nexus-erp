import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { purchaseRequestDetailsApi } from "../../services/purchaseRequestDetails.api";
import { productsApi } from "../../services/products.api";
import { unitsApi } from "../../services/units.api";
import { showToast } from "../../utils/toast";

const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function PurchaseRequestLineFormModal(props) {
  const isEditing = () => !!props.line;

  const [product, setProduct] = createSignal("");
  const [quantity, setQuantity] = createSignal("");
  const [unit, setUnit] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [products] = createResource(() =>
    productsApi.getAll({ isActive: true, limit: 1000 }),
  );
  const [units] = createResource(() => unitsApi.getAll({ isActive: true, limit: 1000 }));
  // RN-COM (units): los documentos del lado compra solo admiten unidades type=purchase.
  const purchaseUnits = () => units()?.data?.filter((u) => u.type === "purchase") || [];

  createEffect(() => {
    const line = props.line;
    setProduct(extractId(line?.product));
    setQuantity(line?.quantity ?? "");
    setUnit(extractId(line?.unit));
    setDescription(line?.description || "");
    setNotes(line?.notes || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      product: product(),
      quantity: Number(quantity()),
      unit: unit(),
      description: description(),
      notes: notes(),
    };

    try {
      if (isEditing()) {
        await purchaseRequestDetailsApi.update(props.line._id, payload);
        showToast.success("Línea actualizada correctamente");
      } else {
        await purchaseRequestDetailsApi.create({
          ...payload,
          purchaseRequest: props.purchaseRequestId,
        });
        showToast.success("Línea agregada exitosamente");
      }
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing() ? "Editar línea" : "Agregar producto"}
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
            <Show when={!products.loading} fallback={<div class="input-field text-gray-400">Cargando...</div>}>
              <select
                required
                class="input-field w-full"
                value={product()}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={products()?.data}>
                  {(p) => <option value={p._id}>{p.name}</option>}
                </For>
              </select>
            </Show>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                class="input-field w-full"
                value={quantity()}
                onInput={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unidad *
              </label>
              <select
                required
                class="input-field w-full"
                value={unit()}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={purchaseUnits()}>
                  {(u) => <option value={u._id}>{u.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <input
              type="text"
              class="input-field w-full"
              value={description()}
              onInput={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              rows="2"
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
              {loading() ? "Guardando..." : isEditing() ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseRequestLineFormModal;
