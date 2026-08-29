import { createResource, Show } from "solid-js";
import { productsApi } from "../../services/products.api";

function Field(props) {
  return (
    <div>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
        {props.label}
      </p>
      <p class="text-sm text-gray-900 dark:text-white">
        {props.value || "-"}
      </p>
    </div>
  );
}

function ProductDetailModal(props) {
  const [detail] = createResource(
    () => props.product?._id,
    (id) => productsApi.getById(id),
  );

  const product = () => detail()?.data;

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle del producto
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <Show when={detail.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando producto...
            </div>
          </Show>

          <Show when={detail.error}>
            <div class="text-center py-8 text-red-500">
              Error al cargar el producto
            </div>
          </Show>

          <Show when={product()}>
            <div class="flex items-center gap-2">
              <span
                class={`w-1.5 h-1.5 rounded-full ${product().isActive ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {product().isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Código interno" value={product().internalCode} />
              <Field label="SKU" value={product().sku} />
              <Field label="Código original" value={product().originalCode} />
            </div>

            <Field label="Nombre" value={product().name} />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Categoría"
                value={product().category?.name}
              />
              <Field
                label="Sub-categoría"
                value={product().subCategory?.name}
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Unidad de compra"
                value={product().purchaseUnit?.name}
              />
              <Field label="Unidad de venta" value={product().saleUnit?.name} />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Tamaño" value={product().size} />
              <Field label="Dimensiones" value={product().dimensions} />
              <Field label="Presentación" value={product().presentation} />
            </div>

            <Field label="Descripción" value={product().description} />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Field
                label="Creado"
                value={
                  product().createdAt &&
                  new Date(product().createdAt).toLocaleString("es-ES")
                }
              />
              <Field
                label="Última actualización"
                value={
                  product().updatedAt &&
                  new Date(product().updatedAt).toLocaleString("es-ES")
                }
              />
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

export default ProductDetailModal;
