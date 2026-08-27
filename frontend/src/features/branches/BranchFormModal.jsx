import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { branchesApi } from "../../services/branches.api";
import { geoApi } from "../../services/geo.api";
import { showToast } from "../../utils/toast";

// department/municipality/district llegan poblados desde el backend
// (subdocumento Mongoose) o como id crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function BranchFormModal(props) {
  const isEditing = () => !!props.branch;

  const [name, setName] = createSignal("");
  const [address, setAddress] = createSignal("");
  const [department, setDepartment] = createSignal("");
  const [municipality, setMunicipality] = createSignal("");
  const [district, setDistrict] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [email, setEmail] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [departments] = createResource(() => geoApi.getDepartments());
  const [municipalities] = createResource(
    () => department() || undefined,
    (deptId) => geoApi.getMunicipalities(deptId),
  );
  const [districts] = createResource(
    () => municipality() || undefined,
    (munId) => geoApi.getDistricts(munId),
  );

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const branch = props.branch;
    setName(branch?.name || "");
    setAddress(branch?.address || "");
    setDepartment(extractId(branch?.department));
    setMunicipality(extractId(branch?.municipality));
    setDistrict(extractId(branch?.district));
    setPhone(branch?.phone || "");
    setEmail(branch?.email || "");
    setError("");
  });

  // Al cambiar manualmente el departamento/municipio, sus hijos quedan obsoletos
  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setMunicipality("");
    setDistrict("");
  };

  const handleMunicipalityChange = (value) => {
    setMunicipality(value);
    setDistrict("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: name(),
      address: address(),
      department: department(),
      municipality: municipality(),
      district: district(),
      phone: phone(),
      email: email(),
    };

    try {
      if (isEditing()) {
        await branchesApi.update(props.branch._id, payload);
        showToast.success("Sucursal actualizada correctamente");
      } else {
        await branchesApi.create(payload);
        showToast.success("Sucursal creada exitosamente");
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
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing() ? "Editar sucursal" : "Nueva sucursal"}
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
              Nombre de la sucursal *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={name()}
              onInput={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={address()}
              onInput={(e) => setAddress(e.target.value)}
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento *
              </label>
              <Show
                when={!departments.loading}
                fallback={
                  <div class="input-field bg-gray-100 dark:bg-gray-800">
                    Cargando...
                  </div>
                }
              >
                <select
                  class="input-field w-full"
                  required
                  value={department()}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  <For each={departments()?.data}>
                    {(dept) => <option value={dept._id}>{dept.name}</option>}
                  </For>
                </select>
              </Show>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Municipio *
              </label>
              <Show
                when={!municipalities.loading}
                fallback={
                  <div class="input-field bg-gray-100 dark:bg-gray-800">
                    Cargando...
                  </div>
                }
              >
                <select
                  class="input-field w-full"
                  required
                  disabled={!department()}
                  value={municipality()}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  <For each={municipalities()?.data}>
                    {(mun) => <option value={mun._id}>{mun.name}</option>}
                  </For>
                </select>
              </Show>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Distrito *
              </label>
              <Show
                when={!districts.loading}
                fallback={
                  <div class="input-field bg-gray-100 dark:bg-gray-800">
                    Cargando...
                  </div>
                }
              >
                <select
                  class="input-field w-full"
                  required
                  disabled={!municipality()}
                  value={district()}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  <For each={districts()?.data}>
                    {(dist) => <option value={dist._id}>{dist.name}</option>}
                  </For>
                </select>
              </Show>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Correo electrónico
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

export default BranchFormModal;
