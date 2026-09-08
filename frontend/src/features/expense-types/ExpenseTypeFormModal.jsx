import { createSignal, createEffect, Show } from "solid-js";
import { expenseTypesApi } from "../../services/expenseTypes.api";
import { showToast } from "../../utils/toast";

function ExpenseTypeFormModal(props) {
  const isEditing = () => !!props.expenseType;

  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const expenseType = props.expenseType;
    setName(expenseType?.name || "");
    setDescription(expenseType?.description || "");
    setError("");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: name(),
      description: description(),
    };

    try {
      if (isEditing()) {
        await expenseTypesApi.update(props.expenseType._id, payload);
        showToast.success("Tipo de gasto actualizado correctamente");
      } else {
        await expenseTypesApi.create(payload);
        showToast.success("Tipo de gasto creado exitosamente");
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
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing() ? "Editar tipo de gasto" : "Nuevo tipo de gasto"}
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
              Nombre *
            </label>
            <input
              type="text"
              required
              class="input-field w-full"
              placeholder="Ej. Flete, Seguro, Aduana..."
              value={name()}
              onInput={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              rows="3"
              class="input-field w-full"
              value={description()}
              onInput={(e) => setDescription(e.target.value)}
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

export default ExpenseTypeFormModal;
