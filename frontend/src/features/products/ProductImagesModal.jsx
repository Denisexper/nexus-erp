import { createSignal, createResource, Show, For } from "solid-js";
import { productImagesApi } from "../../services/productImages.api";
import { SERVER_URL } from "../../services/http";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";

function ProductImagesModal(props) {
  const auth = useAuth();
  const [uploading, setUploading] = createSignal(false);
  let fileInput;

  const [images, { refetch }] = createResource(
    () => props.product,
    async (product) => {
      if (!product) return null;
      return productImagesApi.getByProduct(product._id, { isActive: "" });
    },
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await productImagesApi.upload(props.product._id, file);
      showToast.success("Imagen cargada correctamente");
      refetch();
    } catch (error) {
      showToast.error(error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleStatus = async (image) => {
    try {
      if (image.isActive) {
        await productImagesApi.deactivate(image._id);
      } else {
        await productImagesApi.activate(image._id);
      }
      refetch();
    } catch (error) {
      showToast.error(error.message);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-3xl shadow-xl max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Galería de imágenes
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
          <Show when={auth.hasPermission("product_images.create")}>
            <div class="mb-6">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInput.click()}
                disabled={uploading()}
                class="btn-primary"
              >
                {uploading() ? "Cargando..." : "+ Cargar imagen"}
              </button>
            </div>
          </Show>

          <Show when={images.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando imágenes...
            </div>
          </Show>

          <Show when={images.error}>
            <div class="text-center py-8 text-red-500">
              Error al cargar las imágenes
            </div>
          </Show>

          <Show when={images() && images().data}>
            <Show
              when={images().data.length > 0}
              fallback={
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  Este producto no tiene imágenes cargadas
                </div>
              }
            >
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <For each={images().data}>
                  {(image) => (
                    <div class="card p-2 space-y-2">
                      <img
                        src={`${SERVER_URL}/uploads/${image.path}`}
                        class={`w-full aspect-square object-cover rounded-lg ${!image.isActive ? "opacity-40" : ""}`}
                      />
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5">
                          <span
                            class={`w-1.5 h-1.5 rounded-full ${image.isActive ? "bg-green-500" : "bg-red-500"}`}
                          ></span>
                          <span class="text-xs text-gray-600 dark:text-gray-400">
                            {image.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        <Show
                          when={
                            (image.isActive &&
                              auth.hasPermission(
                                "product_images.deactivate",
                              )) ||
                            (!image.isActive &&
                              auth.hasPermission("product_images.activate"))
                          }
                        >
                          <button
                            onClick={() => toggleStatus(image)}
                            class={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              image.isActive
                                ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                            }`}
                          >
                            {image.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </Show>
                      </div>
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

export default ProductImagesModal;
