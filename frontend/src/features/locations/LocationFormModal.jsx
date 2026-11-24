import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { locationsApi } from "../../services/locations.api";
import { warehousesApi } from "../../services/warehouses.api";
import { showToast } from "../../utils/toast";

// warehouse llega poblado desde el backend (subdocumento Mongoose) o como id
// crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function LocationFormModal(props) {
  const isEditing = () => !!props.location;

  const [warehouse, setWarehouse] = createSignal("");
  const [code, setCode] = createSignal("");
  const [aisle, setAisle] = createSignal("");
  const [rack, setRack] = createSignal("");
  const [level, setLevel] = createSignal("");
  const [position, setPosition] = createSignal("");
  const [capacity, setCapacity] = createSignal("");
  const [type, setType] = createSignal("storage");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo almacenes activos: un almacén inactivo no puede generar nuevas transacciones
  const [warehouses] = createResource(() =>
    warehousesApi.getAll({ isActive: true, limit: 1000 }),
  );

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const location = props.location;
    setWarehouse(extractId(location?.warehouse));
    setCode(location?.code || "");
    setAisle(location?.aisle || "");
    setRack(location?.rack || "");
    setLevel(location?.level || "");
    setPosition(location?.position || "");
    setCapacity(location?.capacity ?? "");
    setType(location?.type || "storage");
    setNotes(location?.notes || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      warehouse: warehouse(),
      code: code(),
      aisle: aisle(),
      rack: rack(),
      level: level(),
      position: position(),
      capacity: Number(capacity()),
      type: type(),
      notes: notes(),
    };

    try {
      if (isEditing()) {
        // warehouse no es editable una vez creada la ubicación; el backend la ignora si se envía
        await locationsApi.update(props.location._id, payload);
        showToast.success("Ubicación actualizada correctamente");
      } else {
        await locationsApi.create(payload);
        showToast.success("Ubicación creada exitosamente");
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
            {isEditing() ? "Editar ubicación" : "Nueva ubicación"}
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
              Almacén *
            </label>
            <Show
              when={!warehouses.loading}
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
                value={warehouse()}
                onChange={(e) => setWarehouse(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={warehouses()?.data}>
                  {(w) => (
                    <option value={w._id}>
                      {w.branch?.name ? `${w.branch.name} - ${w.name}` : w.name}
                    </option>
                  )}
                </For>
              </select>
            </Show>
            <Show when={isEditing()}>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El almacén de una ubicación no puede modificarse.
              </p>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              value={code()}
              onInput={(e) => setCode(e.target.value)}
            />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pasillo
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={aisle()}
                onInput={(e) => setAisle(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estante
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={rack()}
                onInput={(e) => setRack(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nivel
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={level()}
                onInput={(e) => setLevel(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Posición
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={position()}
                onInput={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capacidad *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              class="input-field w-full"
              value={capacity()}
              onInput={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              class="input-field w-full"
              value={type()}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="storage">Almacenamiento</option>
              <option value="vehicle">Vehículo (tránsito de traslados)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones
            </label>
            <textarea
              rows="3"
              class="input-field w-full"
              value={notes()}
              onInput={(e) => setNotes(e.target.value)}
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

export default LocationFormModal;
