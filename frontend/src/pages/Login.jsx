import { createSignal, onMount, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "@solidjs/router";
import { showToast } from "../utils/toast";
import { useDocumentTitle } from "../utils/useDocumentTitle";
import { tenantsApi } from "../services/tenants.api";
import ThemeToggle from "../components/ThemeToggle";
import erpLogoWhite from "../assets/erp-logo-white-512.png";
import erpLogoDark from "../assets/erp-logo-dark-1024.png";

function Login() {
  useDocumentTitle("Iniciar sesión");

  const params = useParams();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [company, setCompany] = createSignal(null);
  const [resolving, setResolving] = createSignal(true);

  const auth = useAuth();
  const navigate = useNavigate();

  onMount(async () => {
    try {
      const res = await tenantsApi.getBySlug(params.slug);
      setCompany(res.data);
    } catch {
      showToast.error("No encontramos esa empresa.");
      navigate("/");
    } finally {
      setResolving(false);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await auth.login(params.slug, email(), password());

    if (result.success) {
      navigate("/dashboard");
      showToast.success(`¡Bienvenido, ${result.user.name}!`);
    } else {
      setError(result.error);
      showToast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <Show when={!resolving()}>
    <div class="auth-bg">
      <div class="auth-brand">
        <Show
          when={company()?.logo}
          fallback={
            <img
              src={erpLogoWhite}
              alt={company()?.commercialName || "Nexus ERP"}
              class="relative w-20 h-20 mb-6 object-contain"
            />
          }
        >
          <img
            src={company().logo}
            alt={company().commercialName}
            class="relative w-20 h-20 mb-6 object-contain"
          />
        </Show>
        <h2 class="relative text-3xl font-bold text-white mb-3">
          {company()?.commercialName || "Nexus ERP"}
        </h2>
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
            <h1 class="text-3xl font-bold mb-1 text-[#2b2f42] dark:text-white">Bienvenido de nuevo</h1>
            <p class="text-muted">Inicia sesión en {company()?.commercialName || "Nexus ERP"}</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Email</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  autocomplete="email"
                  class="auth-input w-full pl-10"
                  placeholder="tu@email.com"
                  value={email()}
                  onInput={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Contraseña</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword() ? "text" : "password"}
                  required
                  autocomplete="current-password"
                  class="auth-input w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={password()}
                  onInput={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword())}
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title={showPassword() ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword() ? (
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

            <button
              type="submit"
              disabled={loading()}
              class="auth-btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading() && (
                <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              )}
              {loading() ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </Show>
  );
}

export default Login;
