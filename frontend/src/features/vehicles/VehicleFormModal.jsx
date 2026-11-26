import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { vehiclesApi } from "../../services/vehicles.api";
import { employeesApi } from "../../services/employees.api";
import { showToast } from "../../utils/toast";

// employee llega poblado desde el backend (subdocumento Mongoose) o como id
// crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const currentYear = new Date().getFullYear();

function VehicleFormModal(props) {
  const isEditing = () => !!props.vehicle;

  const [employee, setEmployee] = createSignal("");
  const [plate, setPlate] = createSignal("");
  const [brand, setBrand] = createSignal("");
  const [model, setModel] = createSignal("");
  const [year, setYear] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo empleados activos: no se puede asignar un conductor de baja a un
  // vehículo nuevo (ver CreateVehicleUseCase en el backend).
  const [employees] = createResource(() =>
    employeesApi.getAll({ isActive: true, limit: 1000 }),
  );

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const vehicle = props.vehicle;
    setEmployee(extractId(vehicle?.employee));
    setPlate(vehicle?.plate || "");
    setBrand(vehicle?.brand || "");
    setModel(vehicle?.model || "");
    setYear(vehicle?.year || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      employee: employee(),
      plate: plate(),
      brand: brand(),
      model: model(),
      year: year(),
    };

    try {
      if (isEditing()) {
        await vehiclesApi.update(props.vehicle._id, payload);
        showToast.success("Vehículo actualizado correctamente");
      } else {
        await vehiclesApi.create(payload);
        showToast.success("Vehículo creado exitosamente");
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
            {isEditing() ? "Editar vehículo" : "Nuevo vehículo"}
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
              Conductor responsable *
            </label>
            <Show
              when={!employees.loading}
              fallback={
                <div class="input-field bg-gray-100 dark:bg-gray-800">
                  Cargando...
                </div>
              }
            >
              <select
                class="input-field w-full"
                required
                value={employee()}
                onChange={(e) => setEmployee(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={employees()?.data}>
                  {(emp) => (
                    <option value={emp._id}>
                      {emp.firstName} {emp.lastName} — {emp.dui}
                    </option>
                  )}
                </For>
              </select>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placa *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={plate()}
              onInput={(e) => setPlate(e.target.value)}
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                required
                class="input-field w-full"
                value={brand()}
                onInput={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                class="input-field w-full"
                value={model()}
                onInput={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Año *
            </label>
            <input
              type="number"
              required
              min="1980"
              max={currentYear + 1}
              class="input-field w-full"
              value={year()}
              onInput={(e) => setYear(e.target.value)}
            />
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

export default VehicleFormModal;
