import { Show } from "solid-js";

export function DetailModal(props) {
  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="relative bg-white dark:bg-night-800 border border-gray-200 dark:border-white/5 w-full max-w-2xl shadow-lg max-h-[85vh] flex flex-col">
        <button
          onClick={props.onClose}
          class="absolute top-3.5 right-4 text-gray-400 dark:text-night-400 hover:text-[#29343E] dark:hover:text-white transition-colors z-10"
        >
          ✕
        </button>

        <div class="flex flex-1 min-h-0">
          <Show when={!props.loading && !props.error}>
            <div class="w-44 flex-shrink-0 border-r border-gray-200 dark:border-white/5 px-5 py-8 flex flex-col items-center text-center gap-2.5">
              <Show when={props.avatar}>{props.avatar}</Show>
              <p class="text-sm font-semibold text-[#29343E] dark:text-white leading-snug">
                {props.title}
              </p>
              <Show when={props.isActive !== undefined}>
                <span
                  class={`text-[11px] font-medium px-2 py-0.5 ${
                    props.isActive
                      ? "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint"
                      : "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral"
                  }`}
                >
                  {props.isActive ? "Activo" : "Inactivo"}
                </span>
              </Show>
              <Show when={props.subtitle}>
                <p class="text-xs text-gray-500 dark:text-night-400 leading-relaxed">
                  {props.subtitle}
                </p>
              </Show>
            </div>
          </Show>

          <div class="flex-1 min-w-0 flex flex-col">
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <Show when={props.loading}>
                <div class="text-center py-16 text-gray-500 dark:text-night-400 text-sm">
                  Cargando información...
                </div>
              </Show>

              <Show when={props.error}>
                <div class="text-center py-16 text-coral-600 dark:text-coral text-sm">
                  Error al cargar la información
                </div>
              </Show>

              <Show when={!props.loading && !props.error}>{props.children}</Show>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 dark:border-white/5 flex-shrink-0">
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
    <div
      class={`space-y-3 ${props.divider ? "pt-6 border-t border-gray-100 dark:border-white/5" : ""}`}
    >
      <h3 class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-night-400">
        {props.title}
      </h3>
      <div
        class={`grid grid-cols-1 gap-x-6 gap-y-4 ${
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
      <p class="text-xs text-gray-500 dark:text-night-400 mb-1">
        {props.label}
      </p>
      <p class="text-sm font-medium text-[#29343E] dark:text-white break-words">
        {props.value || "-"}
      </p>
    </div>
  );
}

export function DetailAvatar(props) {
  return (
    <div class="w-16 h-16 rounded-full bg-vuexy/10 ring-1 ring-vuexy/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
      <Show
        when={props.src}
        fallback={
          <span class="text-xl font-semibold text-vuexy">
            {props.fallback}
          </span>
        }
      >
        <img src={props.src} alt="" class="w-full h-full object-cover" />
      </Show>
    </div>
  );
}
