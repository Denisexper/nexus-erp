import { Show } from "solid-js";

export function DetailModal(props) {
  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-3 min-w-0">
            <Show when={props.avatar}>{props.avatar}</Show>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {props.title}
                </h2>
                <Show when={props.isActive !== undefined}>
                  <span
                    class={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      props.isActive
                        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    }`}
                  >
                    {props.isActive ? "Activo" : "Inactivo"}
                  </span>
                </Show>
              </div>
              <Show when={props.subtitle}>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {props.subtitle}
                </p>
              </Show>
            </div>
          </div>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <Show when={props.loading}>
            <div class="text-center py-10 text-gray-500 dark:text-gray-400">
              Cargando información...
            </div>
          </Show>

          <Show when={props.error}>
            <div class="text-center py-10 text-red-500">
              Error al cargar la información
            </div>
          </Show>

          <Show when={!props.loading && !props.error}>{props.children}</Show>
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

export function DetailSection(props) {
  return (
    <div class={`space-y-3 ${props.divider ? "pt-5 border-t border-gray-100 dark:border-gray-800" : ""}`}>
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {props.title}
      </h3>
      <div
        class={`grid grid-cols-1 gap-4 ${
          props.cols === 3
            ? "md:grid-cols-3"
            : props.cols === 2
              ? "md:grid-cols-2"
              : ""
        }`}
      >
        {props.children}
      </div>
    </div>
  );
}

export function DetailField(props) {
  return (
    <div class={`min-w-0 ${props.full ? "md:col-span-full" : ""}`}>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {props.label}
      </p>
      <p class="text-sm font-medium text-gray-900 dark:text-white break-words">
        {props.value || "-"}
      </p>
    </div>
  );
}

export function DetailAvatar(props) {
  return (
    <div class="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
      <Show
        when={props.src}
        fallback={
          <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {props.fallback}
          </span>
        }
      >
        <img src={props.src} alt="" class="w-full h-full object-cover" />
      </Show>
    </div>
  );
}
