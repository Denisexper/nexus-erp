import { createSignal, createEffect, Show } from "solid-js";
import { supplierContactsApi } from "../../services/supplierContacts.api";
import { suppliersApi } from "../../services/suppliers.api";
import { showToast } from "../../utils/toast";
import SearchableSelect from "../../components/SearchableSelect";

// supplier llega poblado desde el backend (subdocumento Mongoose) o como id
// crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function SupplierContactFormModal(props) {
  const isEditing = () => !!props.contact;

  const [supplier, setSupplier] = createSignal("");
  const [supplierLabel, setSupplierLabel] = createSignal("");
  const [fullName, setFullName] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [email, setEmail] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const contact = props.contact;
    setSupplier(extractId(contact?.supplier));
    setSupplierLabel(
      contact?.supplier && typeof contact.supplier === "object" ? contact.supplier.name : "",
    );
    setFullName(contact?.fullName || "");
    setPhone(contact?.phone || "");
    setEmail(contact?.email || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      supplier: supplier(),
      fullName: fullName(),
      phone: phone(),
      email: email(),
    };

    try {
      if (isEditing()) {
        // supplier no es editable una vez creado el contacto; el backend la ignora si se envía
        await supplierContactsApi.update(props.contact._id, payload);
        showToast.success("Contacto actualizado correctamente");
      } else {
        await supplierContactsApi.create(payload);
        showToast.success("Contacto creado exitosamente");
      }
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing() ? "Editar contacto" : "Nuevo contacto"}
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor *
            </label>
            <SearchableSelect
              required
              disabled={isEditing()}
              value={supplier()}
              displayLabel={supplierLabel()}
              onChange={(id, item) => {
                setSupplier(id);
                setSupplierLabel(item?.name || "");
              }}
              placeholder="Buscar proveedor..."
              fetchOptions={async (search) => {
                const res = await suppliersApi.getAll({ search, isActive: true, limit: 20 });
                return res.data || [];
              }}
              getOptionLabel={(s) => s.name}
              getOptionSubLabel={(s) => s.code}
            />
            <Show when={isEditing()}>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El proveedor de un contacto no puede modificarse.
              </p>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={fullName()}
              onInput={(e) => setFullName(e.target.value)}
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={phone()}
                onInput={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                class="input-field w-full"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Show when={error()}>
            <div class="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error()}
            </div>
          </Show>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              class="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading()}
              class="btn-primary flex-1 disabled:opacity-50"
            >
              {loading() ? "Guardando..." : isEditing() ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierContactFormModal;
