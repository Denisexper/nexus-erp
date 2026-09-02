import { createSignal, createEffect, onCleanup } from "solid-js";

export function useDebounce(source, delay = 150) {
  const [debounced, setDebounced] = createSignal(source());

  createEffect(() => {
    const value = source();
    const timer = setTimeout(() => setDebounced(() => value), delay);
    onCleanup(() => clearTimeout(timer));
  });

  return debounced;
}
