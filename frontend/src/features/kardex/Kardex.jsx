import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { kardexApi } from "../../services/kardex.api";
import { productsApi } from "../../services/products.api";
import { locationsApi } from "../../services/locations.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import KardexMovementModal from "./KardexMovementModal";
import KardexTransferModal from "./KardexTransferModal";
import KardexStockPanel from "./KardexStockPanel";

const REASON_LABELS = {
  purchase: "Compra",
  sale: "Venta",
  adjustment: "Ajuste",
  transfer: "Transferencia",
  return: "Devolución",
  initial: "Carga inicial",
};

function Kardex() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("kardex.view")) {
    navigate("/dashboard");
    return null;
  }

  const [tab, setTab] = createSignal("movements"); // 'movements' | 'stock'

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(15);

  const [productFilter, setProductFilter] = createSignal("");
  const [locationFilter, setLocationFilter] = createSignal("");
  const [typeFilter, setTypeFilter] = createSignal("");
  const [reasonFilter, setReasonFilter] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({});

  const [products] = createResource(() =>
    productsApi.getAll({ isActive: true, limit: 1000 }),
  );
  const [locations] = createResource(() =>
    locationsApi.getAll({ isActive: true, limit: 1000 }),
  );

  const [movements, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => kardexApi.getMovements(params),
  );

  const [showMovementModal, setShowMovementModal] = createSignal(false);
  const [showTransferModal, setShowTransferModal] = createSignal(false);

  const applyFilters = () => {
    const filters = {};
    if (productFilter()) filters.product = productFilter();
    if (locationFilter()) filters.location = locationFilter();
    if (typeFilter()) filters.type = typeFilter();
    if (reasonFilter()) filters.reason = reasonFilter();
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setProductFilter("");
    setLocationFilter("");
    setTypeFilter("");
    setReasonFilter("");
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleMovementSaved = () => {
    setShowMovementModal(false);
    refetch();
  };

  const handleTransferSaved = () => {
    setShowTransferModal(false);
    refetch();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Kardex
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Historial de movimientos de stock y existencias por producto y
                ubicación
              </p>
            </div>
            <Show when={auth.hasPermission("kardex.create")}>
              <div class="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(true)}
                  class="btn-secondary"
                >
                  Transferir stock
                </button>
                <button
                  onClick={() => setShowMovementModal(true)}
                  class="btn-primary"
                >
                  + Registrar movimiento
                </button>
              </div>
            </Show>
          </div>

          {/* Tabs */}
          <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setTab("movements")}
              class={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab() === "movements"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Movimientos
            </button>
            <button
              onClick={() => setTab("stock")}
              class={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab() === "stock"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Existencias
            </button>
          </div>

          <Show when={tab() === "movements"}>
            {/* Filtros */}
            <div class="card mb-6">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Filtros
              </p>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  class="input-field"
                  value={productFilter()}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="">Todos los productos</option>
                  <For each={products()?.data}>
                    {(p) => <option value={p._id}>{p.name}</option>}
                  </For>
                </select>

                <select
                  class="input-field"
                  value={locationFilter()}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">Todas las ubicaciones</option>
                  <For each={locations()?.data}>
                    {(l) => <option value={l._id}>{l.code}</option>}
                  </For>
                </select>

                <select
                  class="input-field"
                  value={typeFilter()}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  <option value="in">Entrada</option>
                  <option value="out">Salida</option>
                </select>

                <select
                  class="input-field"
                  value={reasonFilter()}
                  onChange={(e) => setReasonFilter(e.target.value)}
                >
                  <option value="">Todos los motivos</option>
                  <For each={Object.entries(REASON_LABELS)}>
                    {([value, label]) => (
                      <option value={value}>{label}</option>
                    )}
                  </For>
                </select>
              </div>

              <div class="flex gap-3 mt-4">
                <button onClick={applyFilters} class="btn-primary">
                  🔍 Buscar
                </button>
                <button onClick={clearFilters} class="btn-secondary">
                  ✕ Limpiar filtros
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div class="card overflow-hidden p-0">
              <Show when={movements.loading}>
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                  Cargando movimientos...
                </div>
              </Show>

              <Show when={movements.error}>
                <div class="p-8 text-center text-red-500">
                  Error al cargar movimientos
                </div>
              </Show>

              <Show when={movements()}>
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-800">
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto
                      </th>
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={movements()?.data}>
                      {(movement) => (
                        <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {new Date(movement.createdAt).toLocaleString()}
                          </td>
                          <td class="px-6 py-4">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                              {movement.product?.name || "-"}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              {movement.product?.sku}
                            </p>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {movement.location?.code || "-"}
                          </td>
                          <td class="px-6 py-4">
                            <span
                              class={`text-xs px-2 py-1 rounded-md ${
                                movement.type === "in"
                                  ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {movement.type === "in" ? "Entrada" : "Salida"}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {REASON_LABELS[movement.reason] || movement.reason}
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {movement.quantity}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>

                <Show when={movements()?.pagination}>
                  <Pagination
                    currentPage={currentPage()}
                    totalPages={movements().pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </Show>
              </Show>
            </div>
          </Show>

          <Show when={tab() === "stock"}>
            <KardexStockPanel />
          </Show>
        </div>

        <Show when={showMovementModal()}>
          <KardexMovementModal
            onClose={() => setShowMovementModal(false)}
            onSaved={handleMovementSaved}
          />
        </Show>

        <Show when={showTransferModal()}>
          <KardexTransferModal
            onClose={() => setShowTransferModal(false)}
            onSaved={handleTransferSaved}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Kardex;
