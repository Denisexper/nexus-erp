import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { inventoryApi } from "../../services/inventory.api";
import { productsApi } from "../../services/products.api";
import { warehousesApi } from "../../services/warehouses.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";

// Vista de solo lectura sobre inventory_movements (ERS 6.9.16) — reemplaza
// al Kardex viejo, que era una pantalla de carga manual. Acá no hay botón
// de "registrar movimiento": todo movimiento nace de una recepción, una
// ubicación asignada, un traslado o un ajuste.
const MOVEMENT_TYPE_LABELS = {
  entry: "Entrada",
  exit: "Salida",
  transfer: "Traslado",
  return: "Devolución",
  adjustment: "Ajuste",
};

const MOVEMENT_TYPE_BADGE_CLASS = {
  entry: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  exit: "bg-coral-50 dark:bg-coral/10 text-coral-600 dark:text-coral",
  transfer: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  return: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  adjustment: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function InventoryKardexQuery() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("inventory.kardex.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(20);

  const [productFilter, setProductFilter] = createSignal("");
  const [productFilterLabel, setProductFilterLabel] = createSignal("");
  const [warehouseFilter, setWarehouseFilter] = createSignal("");
  const [movementTypeFilter, setMovementTypeFilter] = createSignal("");
  const [dateFrom, setDateFrom] = createSignal("");
  const [dateTo, setDateTo] = createSignal("");
  const [appliedFilters, setAppliedFilters] = createSignal({});

  const [warehouses] = createResource(() => warehousesApi.getAll({ isActive: true, limit: 1000 }));

  const [movements] = createResource(
    () => ({ ...appliedFilters(), page: currentPage(), limit: limit() }),
    (params) => inventoryApi.getMovements(params),
  );

  const applyFilters = () => {
    const filters = {};
    if (productFilter()) filters.product = productFilter();
    if (warehouseFilter()) filters.warehouse = warehouseFilter();
    if (movementTypeFilter()) filters.movementType = movementTypeFilter();
    if (dateFrom()) filters.dateFrom = dateFrom();
    if (dateTo()) filters.dateTo = dateTo();
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setProductFilter("");
    setProductFilterLabel("");
    setWarehouseFilter("");
    setMovementTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Kardex
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Historial de movimientos de inventario: entradas, salidas, traslados, devoluciones y ajustes
            </p>
          </div>

          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Filtros</p>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <SearchableSelect
                value={productFilter()}
                displayLabel={productFilterLabel()}
                onChange={(id, item) => {
                  setProductFilter(id);
                  setProductFilterLabel(item?.name || "");
                }}
                placeholder="Todos los productos"
                fetchOptions={async (search) => {
                  const res = await productsApi.getAll({ search, isActive: true, limit: 20 });
                  return res.data || [];
                }}
                getOptionLabel={(p) => p.name}
                getOptionSubLabel={(p) => p.internalCode}
              />

              <select class="input-field" value={warehouseFilter()} onChange={(e) => setWarehouseFilter(e.target.value)}>
                <option value="">Todos los almacenes</option>
                <For each={warehouses()?.data}>{(w) => <option value={w._id}>{w.name}</option>}</For>
              </select>

              <select class="input-field" value={movementTypeFilter()} onChange={(e) => setMovementTypeFilter(e.target.value)}>
                <option value="">Todos los tipos</option>
                <For each={Object.entries(MOVEMENT_TYPE_LABELS)}>
                  {([value, label]) => <option value={value}>{label}</option>}
                </For>
              </select>

              <div class="grid grid-cols-2 gap-2">
                <input type="date" class="input-field" value={dateFrom()} onInput={(e) => setDateFrom(e.target.value)} />
                <input type="date" class="input-field" value={dateTo()} onInput={(e) => setDateTo(e.target.value)} />
              </div>
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

          <div class="card overflow-hidden p-0">
            <Show when={movements.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">Cargando movimientos...</div>
            </Show>
            <Show when={movements.error}>
              <div class="p-8 text-center text-red-500">Error al cargar movimientos</div>
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
                      Lote
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Almacén / Ubicación
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Salida
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo unit.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={movements()?.data}>
                    {(movement) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(movement.movementDate).toLocaleString("es-ES")}
                        </td>
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{movement.product?.name || "-"}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{movement.product?.internalCode}</p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {movement.inventoryLot?.lotCode || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {movement.warehouse?.name || "-"} / {movement.location?.code || "-"}
                        </td>
                        <td class="px-6 py-4">
                          <span class={`text-xs px-2 py-1 rounded-md ${MOVEMENT_TYPE_BADGE_CLASS[movement.movementType]}`}>
                            {MOVEMENT_TYPE_LABELS[movement.movementType] || movement.movementType}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-green-600 dark:text-green-400">
                          {movement.quantityIn > 0 ? movement.quantityIn : "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-coral-600 dark:text-coral">
                          {movement.quantityOut > 0 ? movement.quantityOut : "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          ${movement.unitCost?.toFixed(2)}
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
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export default InventoryKardexQuery;
