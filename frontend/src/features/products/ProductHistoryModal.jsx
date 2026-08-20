import { createResource, Show, For } from "solid-js";
import { productsApi } from "../../services/products.api";

const FIELD_LABELS = {
  subCategory: "Sub-categoría",
  purchaseUnit: "Unidad de compra",
  saleUnit: "Unidad de venta",
  internalCode: "Código interno",
  originalCode: "Código original",
  sku: "SKU",
  name: "Nombre",
  size: "Tamaño",
  dimensions: "Dimensiones",
  description: "Descripción",
  presentation: "Presentación",
  isActive: "Estado",
};

const formatValue = (field, value) => {
  if (field === "isActive") return value ? "Activo" : "Inactivo";
  if (value && typeof value === "object") return value.name || "-";
  return value || "-";
};

function ProductHistoryModal(props) {
  const [history] = createResource(
    () => props.product,
    async (product) => {
      if (!product) return null;
      return productsApi.getHistory(product._id);
    },
  );

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-3xl shadow-xl max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Historial de cambios
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {props.product?.name}
            </p>
          </div>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <Show when={history.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando historial...
            </div>
          </Show>

          <Show when={history.error}>
            <div class="text-center py-8 text-red-500">
              Error al cargar el historial
            </div>
          </Show>

          <Show when={history() && history().data}>
            <Show
              when={history().data.length > 0}
              fallback={
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay cambios registrados para este producto
                </div>
              }
            >
              <div class="space-y-4">
                <For each={history().data}>
                  {(log) => (
                    <div class="card border-l-4 border-l-blue-500">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {log.action === "create" && "✨ Producto creado"}
                            {log.action === "update" &&
                              "✏️ Producto actualizado"}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Por {log.user?.name || "Sistema"} •{" "}
                            {new Date(log.createdAt).toLocaleString("es-ES")}
                          </p>
                        </div>
                      </div>

                      <Show when={log.action === "create" && log.dataAfter}>
                        <div class="bg-green-50 dark:bg-green-500/10 rounded-lg p-3 space-y-1">
                          <p class="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
                            Datos iniciales:
                          </p>
                          <For each={Object.keys(FIELD_LABELS)}>
                            {(field) => (
                              <Show when={log.dataAfter[field] !== undefined}>
                                <p class="text-sm text-gray-700 dark:text-gray-300">
                                  <span class="font-medium">
                                    {FIELD_LABELS[field]}:
                                  </span>{" "}
                                  {formatValue(field, log.dataAfter[field])}
                                </p>
                              </Show>
                            )}
                          </For>
                        </div>
                      </Show>

                      <Show
                        when={
                          log.action === "update" &&
                          log.changedFields &&
                          log.changedFields.length > 0
                        }
                      >
                        <div class="space-y-2">
                          <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Campos modificados:
                          </p>
                          <For each={log.changedFields}>
                            {(field) => (
                              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  {FIELD_LABELS[field] || field}
                                </p>
                                <div class="flex items-center gap-2">
                                  <span class="text-sm text-red-600 dark:text-red-400 line-through">
                                    {formatValue(field, log.dataBefore?.[field])}
                                  </span>
                                  <span class="text-gray-400">→</span>
                                  <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                                    {formatValue(field, log.dataAfter?.[field])}
                                  </span>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      <Show
                        when={
                          log.action === "update" &&
                          (!log.changedFields || log.changedFields.length === 0)
                        }
                      >
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Actualización sin cambios en los campos
                          monitoreados.
                        </p>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
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

export default ProductHistoryModal;
