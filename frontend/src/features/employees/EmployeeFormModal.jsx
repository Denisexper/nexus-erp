import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { employeesApi } from "../../services/employees.api";
import { branchesApi } from "../../services/branches.api";
import { showToast } from "../../utils/toast";

// branch llega poblado desde el backend (subdocumento Mongoose) o como id
// crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function EmployeeFormModal(props) {
  const isEditing = () => !!props.employee;

  const [branch, setBranch] = createSignal("");
  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [dui, setDui] = createSignal("");
  const [position, setPosition] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo sucursales activas: no se puede dar de alta personal nuevo bajo una
  // sucursal inactiva (mismo criterio que warehouses).
  const [branches] = createResource(() =>
    branchesApi.getAll({ isActive: true, limit: 1000 }),
  );

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const employee = props.employee;
    setBranch(extractId(employee?.branch));
    setFirstName(employee?.firstName || "");
    setLastName(employee?.lastName || "");
    setEmail(employee?.email || "");
    setPhone(employee?.phone || "");
    setDui(employee?.dui || "");
    setPosition(employee?.position || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      branch: branch(),
      firstName: firstName(),
      lastName: lastName(),
      email: email(),
      phone: phone(),
      dui: dui(),
      position: position(),
    };

    try {
      if (isEditing()) {
        // branch no es editable una vez creado el empleado; el backend la ignora si se envía
        await employeesApi.update(props.employee._id, payload);
        showToast.success("Empleado actualizado correctamente");
      } else {
        await employeesApi.create(payload);
        showToast.success("Empleado creado exitosamente");
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
            {isEditing() ? "Editar empleado" : "Nuevo empleado"}
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
              Sucursal *
            </label>
            <Show
              when={!branches.loading}
              fallback={
                <div class="input-field bg-gray-100 dark:bg-gray-800">
                  Cargando...
                </div>
              }
            >
              <select
                class="input-field w-full disabled:opacity-60"
                required
                disabled={isEditing()}
                value={branch()}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={branches()?.data}>
                  {(b) => <option value={b._id}>{b.name}</option>}
                </For>
              </select>
            </Show>
            <Show when={isEditing()}>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                La sucursal de un empleado no puede modificarse.
              </p>
            </Show>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                class="input-field w-full"
                value={firstName()}
                onInput={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                class="input-field w-full"
                value={lastName()}
                onInput={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              DUI *
            </label>
            <input
              type="text"
              required
              placeholder="########-#"
              class="input-field w-full"
              value={dui()}
              onInput={(e) => setDui(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cargo
            </label>
            <input
              type="text"
              placeholder="Ej. Conductor"
              class="input-field w-full"
              value={position()}
              onInput={(e) => setPosition(e.target.value)}
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo
              </label>
              <input
                type="email"
                class="input-field w-full"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
              />
            </div>
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

export default EmployeeFormModal;
