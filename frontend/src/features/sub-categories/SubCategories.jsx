import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { subCategoriesApi } from "../../services/subCategories.api";
import { categoriesApi } from "../../services/categories.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import SubCategoryFormModal from "./SubCategoryFormModal";
import SubCategoryHistoryModal from "./SubCategoryHistoryModal";
import SubCategoryDetailModal from "./SubCategoryDetailModal";

function SubCategories() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("sub_categories.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [categoryInput, setCategoryInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    category: "",
    isActive: "",
  });

  const [categoriesList] = createResource(() =>
    categoriesApi.getAll({ limit: 1000 }),
  );

  const [subCategories, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.category) filters.category = params.category;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return subCategoriesApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingSubCategory, setEditingSubCategory] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedSubCategory, setSelectedSubCategory] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailSubCategory, setDetailSubCategory] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      category: categoryInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setCategoryInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", category: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingSubCategory(null);
    setShowFormModal(true);
  };

  const openEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
    setShowFormModal(true);
  };

  const openHistory = (subCategory) => {
    setSelectedSubCategory(subCategory);
    setShowHistoryModal(true);
  };

  const openDetail = (subCategory) => {
    setDetailSubCategory(subCategory);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (subCategory) => {
    const action = subCategory.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${subCategory.name}?`,
      async () => {
        try {
          if (subCategory.isActive) {
            await subCategoriesApi.deactivate(subCategory._id);
          } else {
            await subCategoriesApi.activate(subCategory._id);
          }
          refetch();
          showToast.success(
            `Sub-categoría ${action === "desactivar" ? "desactivada" : "activada"} correctamente`,
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
                Sub-categorías
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Clasificación específica dentro de cada categoría de producto
              </p>
            </div>
            <Show when={auth.hasPermission("sub_categories.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nueva sub-categoría
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
                placeholder="Buscar por nombre..."
                value={searchInput()}
                onInput={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />

              <select
                class="input-field"
                value={categoryInput()}
                onChange={(e) => setCategoryInput(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <For each={categoriesList()?.data}>
                  {(c) => <option value={c._id}>{c.name}</option>}
                </For>
              </select>

              <select
                class="input-field"
                value={statusInput()}
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
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
            <Show when={subCategories.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando sub-categorías...
              </div>
            </Show>

            <Show when={subCategories.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar sub-categorías
              </div>
            </Show>

            <Show when={subCategories()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={subCategories()?.data}>
                    {(subCategory) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {subCategory.name}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {subCategory.category?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {subCategory.description || "-"}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${subCategory.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {subCategory.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(subCategory)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(subCategory)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show
                              when={auth.hasPermission("sub_categories.update")}
                            >
                              <button
                                onClick={() => openEdit(subCategory)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (subCategory.isActive &&
                                  auth.hasPermission(
                                    "sub_categories.deactivate",
                                  )) ||
                                (!subCategory.isActive &&
                                  auth.hasPermission(
                                    "sub_categories.activate",
                                  ))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(subCategory)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  subCategory.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {subCategory.isActive
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

              <Show when={subCategories()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={subCategories().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <SubCategoryFormModal
            subCategory={editingSubCategory()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <SubCategoryHistoryModal
            subCategory={selectedSubCategory()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <SubCategoryDetailModal
            subCategory={detailSubCategory()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default SubCategories;
