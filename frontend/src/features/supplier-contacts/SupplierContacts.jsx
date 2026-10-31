import { createSignal, createResource, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { supplierContactsApi } from "../../services/supplierContacts.api";
import { suppliersApi } from "../../services/suppliers.api";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/Pagination";
import { showToast } from "../../utils/toast";
import SupplierContactFormModal from "./SupplierContactFormModal";
import SupplierContactHistoryModal from "./SupplierContactHistoryModal";
import SearchableSelect from "../../components/SearchableSelect";

function SupplierContacts() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.hasPermission("supplier_contacts.view")) {
    navigate("/dashboard");
    return null;
  }

  const [currentPage, setCurrentPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [searchInput, setSearchInput] = createSignal("");
  const [supplierInput, setSupplierInput] = createSignal("");
  const [supplierInputLabel, setSupplierInputLabel] = createSignal("");
  const [statusInput, setStatusInput] = createSignal("");

  const [appliedFilters, setAppliedFilters] = createSignal({
    search: "",
    supplier: "",
    isActive: "",
  });

  const [contacts, { refetch }] = createResource(
    () => ({
      ...appliedFilters(),
      page: currentPage(),
      limit: limit(),
    }),
    (params) => {
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.supplier) filters.supplier = params.supplier;
      if (params.isActive !== "" && params.isActive !== undefined) {
        filters.isActive = params.isActive;
      }
      filters.page = params.page;
      filters.limit = params.limit;
      return supplierContactsApi.getAll(filters);
    },
  );

  const [showFormModal, setShowFormModal] = createSignal(false);
  const [editingContact, setEditingContact] = createSignal(null);

  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [selectedContact, setSelectedContact] = createSignal(null);

  const applyFilters = () => {
    setAppliedFilters({
      search: searchInput(),
      supplier: supplierInput(),
      isActive: statusInput(),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSupplierInput("");
    setSupplierInputLabel("");
    setStatusInput("");
    setAppliedFilters({ search: "", supplier: "", isActive: "" });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreate = () => {
    setEditingContact(null);
    setShowFormModal(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setShowFormModal(true);
  };

  const openHistory = (contact) => {
    setSelectedContact(contact);
    setShowHistoryModal(true);
  };

  const handleSaved = () => {
    setShowFormModal(false);
    refetch();
  };

  const toggleStatus = async (contact) => {
    const action = contact.isActive ? "desactivar" : "activar";
    showToast.confirm(
      `¿Estás seguro de ${action} a ${contact.fullName}?`,
      async () => {
        try {
          if (contact.isActive) {
            await supplierContactsApi.deactivate(contact._id);
          } else {
            await supplierContactsApi.activate(contact._id);
          }
          refetch();
          showToast.success(
            `Contacto ${action === "desactivar" ? "desactivado" : "activado"} correctamente`,
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
                Contactos de proveedor
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Personas de contacto asociadas a cada proveedor
              </p>
            </div>
            <Show when={auth.hasPermission("supplier_contacts.create")}>
              <button onClick={openCreate} class="btn-primary">
                + Nuevo contacto
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

              <SearchableSelect
                value={supplierInput()}
                displayLabel={supplierInputLabel()}
                onChange={(id, item) => {
                  setSupplierInput(id);
                  setSupplierInputLabel(item?.name || "");
                }}
                placeholder="Todos los proveedores"
                fetchOptions={async (search) => {
                  const res = await suppliersApi.getAll({ search, limit: 20 });
                  return res.data || [];
                }}
                getOptionLabel={(s) => s.name}
                getOptionSubLabel={(s) => s.code}
              />

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

          {/* Tabla */}
          <div class="card overflow-hidden p-0">
            <Show when={contacts.loading}>
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando contactos...
              </div>
            </Show>

            <Show when={contacts.error}>
              <div class="p-8 text-center text-red-500">
                Error al cargar contactos
              </div>
            </Show>

            <Show when={contacts()}>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-800">
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto directo
                    </th>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <Show
                      when={
                        auth.hasPermission("supplier_contacts.update") ||
                        auth.hasPermission("logs.read")
                      }
                    >
                      <th class="px-6 py-3"></th>
                    </Show>
                  </tr>
                </thead>
                <tbody>
                  <For each={contacts()?.data}>
                    {(contact) => (
                      <tr class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td class="px-6 py-4">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.fullName}
                          </p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {contact.supplier?.name || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <p>{contact.phone || "-"}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {contact.email || "-"}
                          </p>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                            <span
                              class={`w-1.5 h-1.5 rounded-full ${contact.isActive ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">
                              {contact.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 justify-end">
                            <Show when={auth.hasPermission("logs.read")}>
                              <button
                                onClick={() => openHistory(contact)}
                                class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                Historial
                              </button>
                            </Show>
                            <Show
                              when={auth.hasPermission(
                                "supplier_contacts.update",
                              )}
                            >
                              <button
                                onClick={() => openEdit(contact)}
                                class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                              >
                                Editar
                              </button>
                            </Show>
                            <Show
                              when={
                                (contact.isActive &&
                                  auth.hasPermission(
                                    "supplier_contacts.deactivate",
                                  )) ||
                                (!contact.isActive &&
                                  auth.hasPermission(
                                    "supplier_contacts.activate",
                                  ))
                              }
                            >
                              <button
                                onClick={() => toggleStatus(contact)}
                                class={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  contact.isActive
                                    ? "border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                    : "border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                }`}
                              >
                                {contact.isActive
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

              <Show when={contacts()?.pagination}>
                <Pagination
                  currentPage={currentPage()}
                  totalPages={contacts().pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Show>
            </Show>
          </div>
        </div>

        <Show when={showFormModal()}>
          <SupplierContactFormModal
            contact={editingContact()}
            onClose={() => setShowFormModal(false)}
            onSaved={handleSaved}
          />
        </Show>

        <Show when={showHistoryModal()}>
          <SupplierContactHistoryModal
            contact={selectedContact()}
            onClose={() => setShowHistoryModal(false)}
          />
        </Show>
      </Layout>
    </ProtectedRoute>
  );
}

export default SupplierContacts;
