import { createSignal, createEffect, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { tenantsApi } from "../services/tenants.api";
import { useDebounce } from "../utils/useDebounce";
import { useDocumentTitle } from "../utils/useDocumentTitle";
import ThemeToggle from "../components/ThemeToggle";
import erpLogoWhite from "../assets/erp-logo-white-512.png";
import erpLogoDark from "../assets/erp-logo-dark-1024.png";

function CompanySearch() {
  useDocumentTitle("Buscar mi empresa");

  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const debouncedQuery = useDebounce(query, 150);
  const navigate = useNavigate();

  createEffect(() => {
    const q = debouncedQuery().trim();

    if (q.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    tenantsApi
      .search(q)
      .then((res) => setResults(res.data || []))
      .catch(() => setError("No se pudo buscar empresas. Intenta de nuevo."))
      .finally(() => setLoading(false));
  });

  return (
    <div class="auth-bg">
      <div class="auth-brand">
        <img
          src={erpLogoWhite}
          alt="Nexus ERP"
          class="relative w-20 h-20 mb-6 object-contain"
        />
        <h2 class="relative text-3xl font-bold text-white mb-3">Nexus ERP</h2>
        <p class="relative text-white/60 max-w-xs">
          Gestiona inventario, proveedores y operaciones desde un solo lugar.
        </p>
      </div>

      <div class="auth-form-panel">
        <div class="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div class="w-full max-w-sm animate-fade-in-up">
          <div class="flex flex-col items-center text-center mb-8 lg:items-start lg:text-left">
            <img
              src={erpLogoDark}
              alt="Nexus ERP"
              class="w-14 h-14 mb-4 object-contain lg:hidden dark:hidden"
            />
            <img
              src={erpLogoWhite}
              alt="Nexus ERP"
              class="w-14 h-14 mb-4 object-contain lg:hidden hidden dark:block"
            />
            <h1 class="text-3xl font-bold mb-1 text-[#2b2f42] dark:text-white">Encuentra tu empresa</h1>
            <p class="text-muted">Busca el nombre de tu empresa para continuar</p>
          </div>

          <div class="space-y-4">
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </span>
              <input
                type="text"
                autocomplete="organization"
                class="auth-input w-full pl-10"
                placeholder="Nombre de tu empresa"
                value={query()}
                onInput={(e) => setQuery(e.target.value)}
                autofocus
              />
            </div>

            {error() && (
              <div class="auth-error">
                <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error()}</span>
              </div>
            )}

            <Show when={loading()}>
              <p class="text-sm text-muted text-center py-2">Buscando...</p>
            </Show>

            <Show when={!loading() && query().trim().length >= 2 && results().length === 0 && !error()}>
              <p class="text-sm text-muted text-center py-2">No encontramos ninguna empresa con ese nombre.</p>
            </Show>

            <ul class="space-y-2">
              <For each={results()}>
                {(company) => (
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate(`/login/${company.slug}`)}
                      class="auth-input w-full flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-night-600 transition-colors"
                    >
                      <Show
                        when={company.logo}
                        fallback={
                          <span class="w-8 h-8 shrink-0 flex items-center justify-center bg-[#29343E] text-white text-sm font-semibold dark:bg-vuexy">
                            {company.commercialName?.charAt(0).toUpperCase()}
                          </span>
                        }
                      >
                        <img src={company.logo} alt={company.commercialName} class="w-8 h-8 shrink-0 object-contain" />
                      </Show>
                      <span class="truncate">{company.commercialName}</span>
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanySearch;
