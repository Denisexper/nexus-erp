import { Show } from "solid-js";
import { SERVER_URL } from "../../services/http";
import { useAuth } from "../../context/AuthContext";

function ProductCard(props) {
  const auth = useAuth();
  const { product } = props;

  return (
    <div class="card p-3 space-y-3">
      <Show
        when={props.coverPath}
        fallback={
          <div class="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
            Sin imagen
          </div>
        }
      >
        <img
          src={`${SERVER_URL}/uploads/${props.coverPath}`}
          class="w-full aspect-square object-cover rounded-lg"
        />
      </Show>

      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
          {product.name}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {product.internalCode}
          {product.sku ? ` • ${product.sku}` : ""}
        </p>
        <p class="text-xs text-gray-700 dark:text-gray-300 mt-1">
          {product.subCategory?.name || "-"}
        </p>
      </div>

      <div class="flex items-center gap-1.5">
        <span
          class={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-500" : "bg-red-500"}`}
        ></span>
        <span class="text-xs text-gray-600 dark:text-gray-400">
          {product.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div class="flex flex-wrap gap-1">
        <button
          onClick={() => props.openDetail(product)}
          class="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          Detalle
        </button>
        <Show when={auth.hasPermission("product_images.view")}>
          <button
            onClick={() => props.openImages(product)}
            class="text-xs px-2 py-1 rounded-md border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
          >
            Imágenes
          </button>
        </Show>
        <Show when={auth.hasPermission("logs.read")}>
          <button
            onClick={() => props.openHistory(product)}
            class="text-xs px-2 py-1 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            Historial
          </button>
        </Show>
        <Show when={auth.hasPermission("products.update")}>
          <button
            onClick={() => props.openEdit(product)}
            class="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            Editar
          </button>
        </Show>
        <Show
          when={
            (product.isActive && auth.hasPermission("products.deactivate")) ||
            (!product.isActive && auth.hasPermission("products.activate"))
          }
        >
          <button
            onClick={() => props.toggleStatus(product)}
            class={`text-xs px-2 py-1 rounded-md border transition-colors ${
              product.isActive
                ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
            }`}
          >
            {product.isActive ? "🔒 Desactivar" : "✅ Activar"}
          </button>
        </Show>
      </div>
    </div>
  );
}

export default ProductCard;
