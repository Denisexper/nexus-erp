import { createSignal, createEffect, createResource, Show, For } from "solid-js";
import { productsApi } from "../../services/products.api";
import { subCategoriesApi } from "../../services/subCategories.api";
import { unitsApi } from "../../services/units.api";
import { showToast } from "../../utils/toast";

// subCategory/purchaseUnit/saleUnit llegan poblados desde el backend
// (subdocumento Mongoose) o como id crudo; aquí normalizamos a un id de
// string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function ProductFormModal(props) {
  const isEditing = () => !!props.product;

  const [subCategory, setSubCategory] = createSignal("");
  const [purchaseUnit, setPurchaseUnit] = createSignal("");
  const [saleUnit, setSaleUnit] = createSignal("");
  const [internalCode, setInternalCode] = createSignal("");
  const [originalCode, setOriginalCode] = createSignal("");
  const [sku, setSku] = createSignal("");
  const [name, setName] = createSignal("");
  const [size, setSize] = createSignal("");
  const [dimensions, setDimensions] = createSignal("");
  const [presentation, setPresentation] = createSignal("");
  const [description, setDescription] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo sub-categorías/unidades activas.
  const [subCategories] = createResource(() =>
    subCategoriesApi.getAll({ isActive: true, limit: 1000 }),
  );
  const [units] = createResource(() =>
    unitsApi.getAll({ isActive: true, limit: 1000 }),
  );
  // RN-PRO-008/009: purchase_unit debe ser type=purchase, sale_unit type=sale.
  const purchaseUnits = () => units()?.data?.filter((u) => u.type === "purchase") || [];
  const saleUnits = () => units()?.data?.filter((u) => u.type === "sale") || [];

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const product = props.product;
    setSubCategory(extractId(product?.subCategory));
    setPurchaseUnit(extractId(product?.purchaseUnit));
    setSaleUnit(extractId(product?.saleUnit));
    setInternalCode(product?.internalCode || "");
    setOriginalCode(product?.originalCode || "");
    setSku(product?.sku || "");
    setName(product?.name || "");
    setSize(product?.size || "");
    setDimensions(product?.dimensions || "");
    setPresentation(product?.presentation || "");
    setDescription(product?.description || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      subCategory: subCategory(),
      purchaseUnit: purchaseUnit(),
      saleUnit: saleUnit(),
      internalCode: internalCode(),
      originalCode: originalCode(),
      sku: sku(),
      name: name(),
      size: size(),
      dimensions: dimensions(),
      presentation: presentation(),
      description: description(),
    };

    try {
      if (isEditing()) {
        await productsApi.update(props.product._id, payload);
        showToast.success("Producto actualizado correctamente");
      } else {
        await productsApi.create(payload);
        showToast.success("Producto creado exitosamente");
      }
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
            {isEditing() ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código interno *
              </label>
              <input
                type="text"
                required
                class="input-field w-full"
                value={internalCode()}
                onInput={(e) => setInternalCode(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={sku()}
                onInput={(e) => setSku(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código original
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={originalCode()}
                onInput={(e) => setOriginalCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={name()}
              onInput={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sub-categoría *
            </label>
            <Show
              when={!subCategories.loading}
              fallback={
                <div class="input-field bg-gray-100 dark:bg-gray-800">
                  Cargando...
                </div>
              }
            >
              <select
                class="input-field w-full"
                required
                value={subCategory()}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={subCategories()?.data}>
                  {(sc) => (
                    <option value={sc._id}>
                      {sc.category?.name
                        ? `${sc.category.name} - ${sc.name}`
                        : sc.name}
                    </option>
                  )}
                </For>
              </select>
            </Show>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unidad de compra *
              </label>
              <Show
                when={!units.loading}
                fallback={
                  <div class="input-field bg-gray-100 dark:bg-gray-800">
                    Cargando...
                  </div>
                }
              >
                <select
                  class="input-field w-full"
                  required
                  value={purchaseUnit()}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  <For each={purchaseUnits()}>
                    {(u) => <option value={u._id}>{u.name}</option>}
                  </For>
                </select>
              </Show>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unidad de venta *
              </label>
              <Show
                when={!units.loading}
                fallback={
                  <div class="input-field bg-gray-100 dark:bg-gray-800">
                    Cargando...
                  </div>
                }
              >
                <select
                  class="input-field w-full"
                  required
                  value={saleUnit()}
                  onChange={(e) => setSaleUnit(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  <For each={saleUnits()}>
                    {(u) => <option value={u._id}>{u.name}</option>}
                  </For>
                </select>
              </Show>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tamaño
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={size()}
                onInput={(e) => setSize(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dimensiones
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={dimensions()}
                onInput={(e) => setDimensions(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Presentación
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={presentation()}
                onInput={(e) => setPresentation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              rows="3"
              class="input-field w-full"
              value={description()}
              onInput={(e) => setDescription(e.target.value)}
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
              {loading() ? "Guardando..." : isEditing() ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
