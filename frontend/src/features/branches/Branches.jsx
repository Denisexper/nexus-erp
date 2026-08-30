import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { branchesApi } from "../../services/branches.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import BranchFormModal from "./BranchFormModal";
import BranchHistoryModal from "./BranchHistoryModal";
import BranchDetailModal from "./BranchDetailModal";

function Branches() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("branches.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    isActive: "",
  });

  const [branches, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return branchesApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingBranch, setEditingBranch] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedBranch, setSelectedBranch] = createSignal(null);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [detailBranch, setDetailBranch] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setAppliedFilters({ search: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingBranch(null);
    setShowFormModal(true);
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setShowFormModal(true);
  };

  const openHistory = (branch) => {
    setSelectedBranch(branch);
    setShowHistoryModal(true);
  };

  const openDetail = (branch) => {
    setDetailBranch(branch);
    setShowDetailModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (branch) => {
    const action = branch.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${branch.name}?`,
      async () => {
        try {
          if (branch.isActive) {
            await branchesApi.deactivate(branch._id);
          } else {
            await branchesApi.activate(branch._id);
          }
          refetch();
          showToast.success(
            `Sucursal ${action === "desactivar" ? "desactivada" : "activada"} correctamente`,
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
                Sucursales
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra las sedes y establecimientos de cada empresa
              </p>
            </div>
            <Show when={auth.hasPermission("branches.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nueva sucursal
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
            <Show when={branches.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando sucursales...
              </div>
            </Show>

            <Show when={branches.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar sucursales
              </div>
            </Show>

            <Show when={branches()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={branches()?.data}>
                    {(branch) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {branch.name}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {branch.address}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {branch.company?.commercialName ||
                            branch.company?.name ||
                            "-"}
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {[
                            branch.district?.name,
                            branch.municipality?.name,
                            branch.department?.name,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          <p>{branch.phone || "-"}</p>
                          <p>{branch.email || "-"}</p>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${branch.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {branch.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openDetail(branch)}
                              title="Ver detalle"
                              class="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                              👁️
                            </button>
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(branch)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("branches.update")}>
                              <button
                                onClick={() => openEdit(branch)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (branch.isActive &&
                                  auth.hasPermission("branches.deactivate")) ||
                                (!branch.isActive &&
                                  auth.hasPermission("branches.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(branch)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  branch.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {branch.isActive
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

              <Show when={branches()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={branches().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <BranchFormModal
            branch={editingBranch()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <BranchHistoryModal
            branch={selectedBranch()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>

        <Show when={showDetailModal()}>
          <BranchDetailModal
            branch={detailBranch()}
            onClose={() => setShowDetailModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Branches;
