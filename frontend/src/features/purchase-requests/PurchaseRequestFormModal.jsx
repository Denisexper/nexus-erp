import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { purchaseRequestsApi } from "../../services/purchaseRequests.api";
import { branchesApi } from "../../services/branches.api";
import { warehousesApi } from "../../services/warehouses.api";
import { showToast } from "../../utils/toast";

// branch/warehouse llegan poblados desde el backend (subdocumento Mongoose)
// o como id crudo; aquí normalizamos a un id de string.
const extractId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

// input type="date" necesita YYYY-MM-DD, no el ISO completo que manda el backend.
const toDateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

function PurchaseRequestFormModal(props) {
  const isEditing = () => !!props.purchaseRequest;

  const [branch, setBranch] = createSignal("");
  const [warehouse, setWarehouse] = createSignal("");
  const [requiredDate, setRequiredDate] = createSignal("");
  const [justification, setJustification] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo sucursales activas: una sucursal inactiva no puede generar nuevas
  // transacciones (mismo criterio que branches/warehouses en otros módulos).
  const [branches] = createResource(() =>
    branchesApi.getAll({ isActive: true, limit: 1000 }),
  );

  // Cascada: los almacenes disponibles dependen de la sucursal elegida.
  const [warehouses] = createResource(
    () => branch() || undefined,
    (branchId) => warehousesApi.getAll({ branch: branchId, isActive: true, limit: 1000 }),
  );

  // Precargar el formulario al abrir en modo edición (o limpiarlo en modo creación)
  createEffect(() => {
    const purchaseRequest = props.purchaseRequest;
    setBranch(extractId(purchaseRequest?.branch));
    setWarehouse(extractId(purchaseRequest?.warehouse));
    setRequiredDate(toDateInputValue(purchaseRequest?.requiredDate));
    setJustification(purchaseRequest?.justification || "");
    setNotes(purchaseRequest?.notes || "");
    setError("");
  });

  // Si cambia la sucursal, el almacén anterior deja de ser válido.
  const handleBranchChange = (value) => {
    setBranch(value);
    setWarehouse("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      branch: branch(),
      warehouse: warehouse(),
      requiredDate: requiredDate(),
      justification: justification(),
      notes: notes(),
    };

    try {
      if (isEditing()) {
        await purchaseRequestsApi.update(props.purchaseRequest._id, payload);
        showToast.success("Solicitud de compra actualizada correctamente");
      } else {
        await purchaseRequestsApi.create(payload);
        showToast.success("Solicitud de compra creada exitosamente");
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
            {isEditing() ? "Editar solicitud de compra" : "Nueva solicitud de compra"}
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4 overflow-y-auto">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sucursal *
              </label>
              <Show when={!branches.loading} fallback={<div class="input-field text-gray-400">Cargando...</div>}>
                <select
                  required
                  class="input-field w-full"
                  value={branch()}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <For each={branches()?.data}>
                    {(b) => <option value={b._id}>{b.name}</option>}
                  </For>
                </select>
              </Show>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén *
              </label>
              <select
                required
                disabled={!branch()}
                class="input-field w-full disabled:opacity-50"
                value={warehouse()}
                onChange={(e) => setWarehouse(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={warehouses()?.data}>
                  {(w) => <option value={w._id}>{w.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha requerida
            </label>
            <input
              type="date"
              class="input-field w-full"
              value={requiredDate()}
              onInput={(e) => setRequiredDate(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Justificación
            </label>
            <textarea
              rows="2"
              class="input-field w-full"
              placeholder="Motivo de la solicitud..."
              value={justification()}
              onInput={(e) => setJustification(e.target.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              rows="2"
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

          <Show when={!isEditing()}>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              La solicitud se crea en borrador. Agrega los productos desde el detalle antes de enviarla.
            </p>
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

export default PurchaseRequestFormModal;
