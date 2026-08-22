import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { productsApi } from "../../services/products.api";
import { subCategoriesApi } from "../../services/subCategories.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import { productImagesApi } from "../../services/productImages.api";
import ProductFormModal from "./ProductFormModal";
import ProductHistoryModal from "./ProductHistoryModal";
import ProductImagesModal from "./ProductImagesModal";
import ProductCard from "./ProductCard";

function Products() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("products.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [subCategoryInput, setSubCategoryInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    subCategory: "",
    isActive: "",
  });

  const [subCategoriesList] = createResource(() =>
    subCategoriesApi.getAll({ limit: 1000 }),
  );

  const [products, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.subCategory) filters.subCategory = params.subCategory;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return productsApi.getAll(filters);
    },
  );

  const [viewMode, setViewMode] = createSignal("table");

  const [covers] = createResource(
    () => {
      if (viewMode() !== "grid") return null;
      if (!auth.hasPermission("product_images.view")) return null;
      const ids = products()?.data?.map((p) => p._id);
      return ids && ids.length > 0 ? ids : null;
    },
    (productIds) => productImagesApi.getCovers(productIds),
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingProduct, setEditingProduct] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedProduct, setSelectedProduct] = createSignal(null);

  const [showImagesModal, setShowImagesModal] = createSignal(false);
  const [imagesProduct, setImagesProduct] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      subCategory: subCategoryInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSubCategoryInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", subCategory: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  const openHistory = (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const openImages = (product) => {
    setImagesProduct(product);
    setShowImagesModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (product) => {
    const action = product.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${product.name}?`,
      async () => {
        try {
          if (product.isActive) {
            await productsApi.deactivate(product._id);
          } else {
            await productsApi.activate(product._id);
          }
          refetch();
          showToast.success(
            `Producto ${action === "desactivar" ? "desactivado" : "activado"} correctamente`,
          );
        } catch (error) {
          showToast.error(error.message);
        }
      },
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div class="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Productos
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Catálogo de productos del sistema
              </p>
            </div>
            <Show when={auth.hasPermission("products.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nuevo producto
              </button>
            </Show>
          </div>

          {/* Filtros */}
          <div class="card mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filtros
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                class="input-field"
                placeholder="Buscar por nombre, código interno, código original o SKU..."
                value={searchInput()}
                onInput={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />

              <select
                class="input-field"
                value={subCategoryInput()}
                onChange={(e) => setSubCategoryInput(e.target.value)}
              >
                <option value="">Todas las sub-categorías</option>
                <For each={subCategoriesList()?.data}>
                  {(sc) => (
                    <option value={sc._id}>
                      {sc.category?.name
                        ? `${sc.category.name} - ${sc.name}`
                        : sc.name}
                    </option>
                  )}
                </For>
              </select>

              <select
                class="input-field"
                value={statusInput()}
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
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

          {/* Toggle vista */}
          <div class="flex justify-end mb-4">
            <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                class={`text-xs px-3 py-1.5 transition-colors ${
                  viewMode() === "table"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                Tabla
              </button>
              <button
                onClick={() => setViewMode("grid")}
                class={`text-xs px-3 py-1.5 transition-colors ${
                  viewMode() === "grid"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                Cards
              </button>
            </div>
          </div>

          {/* Tabla / Cards */}
          <div
            class={
              viewMode() === "table" ? "card overflow-hidden p-0" : ""
            }
          >
            <Show when={products.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando productos...
              </div>
            </Show>

            <Show when={products.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar productos
              </div>
            </Show>

            <Show when={products()}>
              <Show
                when={viewMode() === "table"}
                fallback={
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <For each={products()?.data}>
                      {(product) => (
                        <ProductCard
                          product={product}
                          coverPath={covers()?.data?.[product._id]}
                          openImages={openImages}
                          openHistory={openHistory}
                          openEdit={openEdit}
                          toggleStatus={toggleStatus}
                        />
                      )}
                    </For>
                  </div>
                }
              >
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sub-categoría
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unidades (compra/venta)
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <Show
                      when={
                        auth.hasPermission("products.update") ||
                        auth.hasPermission("logs.read") ||
                        auth.hasPermission("product_images.view")
                      }
                    >
                      <th class="px-6 py-3"></th>
                    </Show>
                  </tr>
                </thead>
                <tbody>
                  <For each={products()?.data}>
                    {(product) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {product.internalCode}
                            {product.sku ? ` • ${product.sku}` : ""}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {product.subCategory?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {product.purchaseUnit?.name || "-"} /{" "}
                          {product.saleUnit?.name || "-"}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {product.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <Show when={auth.hasPermission("product_images.view")}>
                              <button
                                onClick={() => openImages(product)}
                                class="text-xs px-3 py-1.5 rounded-md border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                              >
                                Imágenes
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(product)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("products.update")}>
                              <button
                                onClick={() => openEdit(product)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (product.isActive &&
                                  auth.hasPermission("products.deactivate")) ||
                                (!product.isActive &&
                                  auth.hasPermission("products.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(product)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  product.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {product.isActive
                                  ? "🔒 Desactivar"
                                  : "✅ Activar"}
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
              </Show>

              <Show when={products()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={products().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <ProductFormModal
            product={editingProduct()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <ProductHistoryModal
            product={selectedProduct()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showImagesModal()}>
          <ProductImagesModal
            product={imagesProduct()}
            onClose={() => setShowImagesModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Products;
