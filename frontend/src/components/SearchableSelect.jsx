import { createSignal, createResource, createEffect, onMount, onCleanup, Show, For } from "solid-js";

// Combobox con búsqueda server-side: reemplaza los <select> que cargaban
// catálogos completos con limit:1000 (proveedores, productos). Sin
// escribir nada, muestra los más recientes (el backend ya ordena por
// createdAt desc); al escribir, filtra contra el backend con `search`.
//
// Props:
//   value           id seleccionado actual
//   onChange(id, item)  item es el objeto completo, o null al limpiar
//   displayLabel    texto a mostrar para el valor actual antes de abrir
//                   (ej. el nombre ya poblado en un form de edición)
//   fetchOptions(search)  async (search) => array de opciones (ya
//                   resuelto, sin el wrapper {data, total, ...})
//   getOptionLabel(item)
//   getOptionSubLabel(item)   opcional, texto secundario (ej. código)
//   placeholder, required, disabled, id
function SearchableSelect(props) {
  let containerRef;
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [debounced, setDebounced] = createSignal("");
  const [label, setLabel] = createSignal(props.displayLabel || "");

  createEffect(() => setLabel(props.displayLabel || ""));

  let timer;
  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timer);
    timer = setTimeout(() => setDebounced(v), 300);
  };
  onCleanup(() => clearTimeout(timer));

  const [options] = createResource(
    () => ({ open: open(), q: debounced() }),
    async ({ open: isOpen, q }) => {
      if (!isOpen) return [];
      try {
        return await props.fetchOptions(q);
      } catch {
        return [];
      }
    },
  );

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
    setDebounced("");
  };

  const selectOption = (item) => {
    setLabel(props.getOptionLabel(item));
    setQuery("");
    setOpen(false);
    props.onChange(item._id, item);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setLabel("");
    props.onChange("", null);
  };

  const handleDocClick = (e) => {
    if (containerRef && !containerRef.contains(e.target)) setOpen(false);
  };
  onMount(() => document.addEventListener("mousedown", handleDocClick));
  onCleanup(() => document.removeEventListener("mousedown", handleDocClick));

  return (
    <div class="relative" ref={containerRef}>
      <input
        type="text"
        id={props.id}
        class="input-field w-full pr-8"
        placeholder={props.placeholder || "Buscar..."}
        value={open() ? query() : label()}
        onInput={handleInput}
        onFocus={handleFocus}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            e.target.blur();
          }
        }}
        required={props.required}
        disabled={props.disabled}
        autocomplete="off"
      />
      <Show
        when={props.value && !open()}
        fallback={
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ▾
          </span>
        }
      >
        <button
          type="button"
          onClick={clearSelection}
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-coral-600 dark:hover:text-coral"
        >
          ✕
        </button>
      </Show>

      <Show when={open()}>
        <div class="absolute z-20 mt-1 w-full bg-white dark:bg-night-800 border border-gray-300 dark:border-night-600 shadow-lg max-h-60 overflow-y-auto">
          <Show when={options.loading}>
            <div class="px-4 py-2 text-sm text-gray-400 dark:text-night-400">Buscando...</div>
          </Show>
          <Show when={!options.loading && (options() || []).length === 0}>
            <div class="px-4 py-2 text-sm text-gray-400 dark:text-night-400">Sin resultados</div>
          </Show>
          <For each={options()}>
            {(item) => (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(item);
                }}
                class={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-night-700 ${
                  item._id === props.value ? "bg-gray-50 dark:bg-night-700/50 font-medium" : ""
                }`}
              >
                <div class="text-[#29343E] dark:text-white">{props.getOptionLabel(item)}</div>
                <Show when={props.getOptionSubLabel}>
                  <div class="text-xs text-gray-400 dark:text-night-400">{props.getOptionSubLabel(item)}</div>
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default SearchableSelect;
