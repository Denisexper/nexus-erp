import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { companiesApi } from "../../services/companies.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import CompanyFormModal from "./CompanyFormModal";
import CompanyHistoryModal from "./CompanyHistoryModal";

function Companies() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("companies.read")) {
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

  const [companies, { refetch }] = createResource(
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
      return companiesApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingCompany, setEditingCompany] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedCompany, setSelectedCompany] = createSignal(null);

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
    setEditingCompany(null);
    setShowFormModal(true);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setShowFormModal(true);
  };

  const openHistory = (company) => {
    setSelectedCompany(company);
    setShowHistoryModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (company) => {
    const action = company.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} ${company.name}?`,
      async () => {
        try {
          if (company.isActive) {
            await companiesApi.deactivate(company._id);
          } else {
            await companiesApi.activate(company._id);
          }
          refetch();
          showToast.success(
            `Empresa ${action === "desactivar" ? "desactivada" : "activada"} correctamente`,
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
                Empresas
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Administra la información legal, tributaria y comercial de las
                empresas
              </p>
            </div>
            <Show when={auth.hasPermission("companies.create")}>
              <button
                onClick={openCreate}
                disabled
                title="Disponible próximamente desde el panel de super administración"
                class="btn-primary opacity-50 cursor-not-allowed"
              >
                + Nueva empresa
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
                placeholder="Buscar por razón social, nombre comercial, NIT o NRC..."
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
            <Show when={companies.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando empresas...
              </div>
            </Show>

            <Show when={companies.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar empresas
              </div>
            </Show>

            <Show when={companies()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      NIT / NRC
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <Show
                      when={
                        auth.hasPermission("companies.update") ||
                        auth.hasPermission("logs.read")
                      }
                    >
                      <th class="px-6 py-3"></th>
                    </Show>
                  </tr>
                </thead>
                <tbody>
                  <For each={companies()?.data}>
                    {(company) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <Show
                                when={company.logo}
                                fallback={
                                  <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {company.commercialName
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </span>
                                }
                              >
                                <img
                                  src={company.logo}
                                  alt=""
                                  class="w-full h-full object-cover"
                                />
                              </Show>
                            </div>
                            <div>
                              <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {company.commercialName}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {company.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <p>NIT: {company.nit}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            NRC: {company.nrc}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {[
                            company.district?.name,
                            company.municipality?.name,
                            company.department?.name,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${company.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {company.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(company)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show when={auth.hasPermission("companies.update")}>
                              <button
                                onClick={() => openEdit(company)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (company.isActive &&
                                  auth.hasPermission("companies.deactivate")) ||
                                (!company.isActive &&
                                  auth.hasPermission("companies.activate"))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(company)}
                                disabled
                                title="Disponible próximamente desde el panel de super administración"
                                class={`text-xs px-3 py-1.5 rounded-md border opacity-50 cursor-not-allowed ${
                                  company.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400"
                                }`}
                              >
                                {company.isActive
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

              <Show when={companies()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={companies().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <CompanyFormModal
            company={editingCompany()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <CompanyHistoryModal
            company={selectedCompany()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default Companies;
