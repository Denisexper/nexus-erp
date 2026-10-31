import { createSignal, createResource, Show, For } from "solid-js";
import { kardexApi } from "../../services/kardex.api";
import { productsApi } from "../../services/products.api";
import { locationsApi } from "../../services/locations.api";
import SearchableSelect from "../../components/SearchableSelect";

function KardexStockPanel() {
  const [mode, setMode] = createSignal("location"); // 'location' | 'product'
  const [selectedLocation, setSelectedLocation] = createSignal("");
  const [selectedProduct, setSelectedProduct] = createSignal("");
  const [selectedProductLabel, setSelectedProductLabel] = createSignal("");

  const [locations] = createResource(() =>
    locationsApi.getAll({ isActive: true, limit: 1000 }),
  );

  const [stock] = createResource(
    () =>
      mode() === "location"
        ? selectedLocation() || null
        : selectedProduct() || null,
    (id) =>
      mode() === "location"
        ? kardexApi.getStockByLocation(id)
        : kardexApi.getStockByProduct(id),
  );

  const switchMode = (next) => {
    setMode(next);
    setSelectedLocation("");
    setSelectedProduct("");
    setSelectedProductLabel("");
  };

  return (
    <div class="card">
      <div class="flex gap-2 mb-4">
        <button
          onClick={() => switchMode("location")}
          class={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            mode() === "location"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          Por ubicación
        </button>
        <button
          onClick={() => switchMode("product")}
          class={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            mode() === "product"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          Por producto
        </button>
      </div>

      <Show when={mode() === "location"}>
        <select
          class="input-field w-full md:w-96 mb-4"
          value={selectedLocation()}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Selecciona una ubicación...</option>
          <For each={locations()?.data}>
            {(l) => <option value={l._id}>{l.code}</option>}
          </For>
        </select>
      </Show>

      <Show when={mode() === "product"}>
        <div class="w-full md:w-96 mb-4">
          <SearchableSelect
            value={selectedProduct()}
            displayLabel={selectedProductLabel()}
            onChange={(id, item) => {
              setSelectedProduct(id);
              setSelectedProductLabel(item?.name || "");
            }}
            placeholder="Buscar producto..."
            fetchOptions={async (search) => {
              const res = await productsApi.getAll({ search, isActive: true, limit: 20 });
              return res.data || [];
            }}
            getOptionLabel={(p) => `${p.name} (${p.sku})`}
            getOptionSubLabel={(p) => p.internalCode}
          />
        </div>
      </Show>

      <Show when={stock.loading}>
        <div class="text-center text-gray-500 dark:text-gray-400 py-6">
          Cargando existencias...
        </div>
      </Show>

      <Show when={!stock.loading && stock() && stock().data.length === 0}>
        <div class="text-center text-gray-500 dark:text-gray-400 py-6">
          Sin existencias registradas.
        </div>
      </Show>

      <Show when={!stock.loading && stock()?.data?.length > 0}>
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {mode() === "location" ? "Producto" : "Ubicación"}
              </th>
              <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Existencia
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={stock().data}>
              {(row) => (
                <tr class="border-b border-gray-100 dark:border-gray-800/50">
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {mode() === "location"
                      ? `${row.product.name} (${row.product.sku})`
                      : row.location.code}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {row.stock}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}

export default KardexStockPanel;
