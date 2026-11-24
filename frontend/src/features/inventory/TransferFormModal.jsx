import { createSignal, createResource, Show, For } from "solid-js";
import { inventoryTransfersApi } from "../../services/inventoryTransfers.api";
import { inventoryApi } from "../../services/inventory.api";
import { warehousesApi } from "../../services/warehouses.api";
import { locationsApi } from "../../services/locations.api";
import { showToast } from "../../utils/toast";

// Una línea de traslado en su propio componente: así cada una trae, con su
// propio createResource, las ubicaciones donde SU lote realmente tiene
// existencias (GET /lots/:id/locations) en vez de listar todas las
// ubicaciones del almacén sin filtrar.
function TransferLineFields(props) {
  const [lotLocations] = createResource(
    () => props.line.inventoryLot,
    (lotId) => inventoryApi.getLotLocations(lotId),
  );

  const availableSourceLocations = () =>
    (lotLocations()?.data || []).filter((d) => d.location?.warehouse === props.sourceWarehouse());

  const handleLotChange = (value) => {
    props.updateLine(props.index(), "inventoryLot", value);
    props.updateLine(props.index(), "sourceLocation", "");
  };

  return (
    <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Lote *</label>
          <select
            class="input-field w-full text-sm"
            required
            value={props.line.inventoryLot}
            onChange={(e) => handleLotChange(e.target.value)}
          >
            <option value="">Selecciona...</option>
            <For each={props.placeableLots()}>
              {(lot) => (
                <option value={lot._id}>
                  {lot.lotCode} — {lot.product?.name}
                </option>
              )}
            </For>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ubicación origen *</label>
          <select
            class="input-field w-full text-sm"
            required
            disabled={!props.line.inventoryLot || !props.sourceWarehouse()}
            value={props.line.sourceLocation}
            onChange={(e) => props.updateLine(props.index(), "sourceLocation", e.target.value)}
          >
            <option value="">Selecciona...</option>
            <For each={availableSourceLocations()}>
              {(d) => (
                <option value={d.location._id}>
                  {d.location.code} — {d.quantity} disponibles
                </option>
              )}
            </For>
          </select>
          <Show when={props.line.inventoryLot && props.sourceWarehouse() && !lotLocations.loading && availableSourceLocations().length === 0}>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Este lote no tiene existencias en el almacén de origen elegido.
            </p>
          </Show>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ubicación destino *</label>
          <select
            class="input-field w-full text-sm"
            required
            disabled={!props.destinationWarehouse()}
            value={props.line.destinationLocation}
            onChange={(e) => props.updateLine(props.index(), "destinationLocation", e.target.value)}
          >
            <option value="">Selecciona...</option>
            <For each={props.destinationLocations()?.data}>{(l) => <option value={l._id}>{l.code}</option>}</For>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cantidad *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            class="input-field w-full text-sm"
            value={props.line.quantityDispatched}
            onInput={(e) => props.updateLine(props.index(), "quantityDispatched", e.target.value)}
          />
        </div>
      </div>
      <Show when={props.canRemove}>
        <button
          type="button"
          onClick={() => props.removeLine(props.index())}
          class="text-xs text-coral-600 dark:text-coral hover:underline"
        >
          Quitar línea
        </button>
      </Show>
    </div>
  );
}

// Crear un traslado solo planifica (ERS 6.9.19): todavía no mueve stock,
// eso pasa al despachar. La ubicación vehículo se exige siempre en esta
// fase (sin atajo de traslado directo dentro del mismo almacén).
function TransferFormModal(props) {
  const [sourceWarehouse, setSourceWarehouse] = createSignal("");
  const [destinationWarehouse, setDestinationWarehouse] = createSignal("");
  const [vehicleLocation, setVehicleLocation] = createSignal("");
  const [transferDate, setTransferDate] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [lines, setLines] = createSignal([{ inventoryLot: "", sourceLocation: "", destinationLocation: "", quantityDispatched: "" }]);

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [warehouses] = createResource(() => warehousesApi.getAll({ isActive: true, limit: 1000 }));
  const [vehicleLocations] = createResource(() => locationsApi.getAll({ type: "vehicle", isActive: true, limit: 1000 }));
  const [destinationLocations] = createResource(destinationWarehouse, (w) =>
    w ? locationsApi.getAll({ warehouse: w, type: "storage", isActive: true, limit: 1000 }) : null,
  );
  // Solo lotes que ya tienen algo ubicado en algún lado pueden trasladarse.
  const [lots] = createResource(() => inventoryApi.getLots({ limit: 1000 }));
  const placeableLots = () => (lots()?.data || []).filter((l) => ["placed", "partially_placed"].includes(l.status));

  const addLine = () => {
    setLines((prev) => [...prev, { inventoryLot: "", sourceLocation: "", destinationLocation: "", quantityDispatched: "" }]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await inventoryTransfersApi.create({
        sourceWarehouse: sourceWarehouse(),
        destinationWarehouse: destinationWarehouse(),
        vehicleLocation: vehicleLocation(),
        transferDate: transferDate() || undefined,
        notes: notes(),
        lines: lines().map((l) => ({
          inventoryLot: l.inventoryLot,
          sourceLocation: l.sourceLocation,
          destinationLocation: l.destinationLocation,
          quantityDispatched: Number(l.quantityDispatched),
        })),
      });
      showToast.success("Traslado creado exitosamente");
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-4xl shadow-xl max-h-[92vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Nuevo traslado entre almacenes
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-6 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén de origen *
              </label>
              <select
                class="input-field w-full"
                required
                value={sourceWarehouse()}
                onChange={(e) => setSourceWarehouse(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={warehouses()?.data}>{(w) => <option value={w._id}>{w.name}</option>}</For>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén de destino *
              </label>
              <select
                class="input-field w-full"
                required
                value={destinationWarehouse()}
                onChange={(e) => setDestinationWarehouse(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={warehouses()?.data}>{(w) => <option value={w._id}>{w.name}</option>}</For>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vehículo (ubicación de tránsito) *
              </label>
              <select
                class="input-field w-full"
                required
                value={vehicleLocation()}
                onChange={(e) => setVehicleLocation(e.target.value)}
              >
                <option value="">Selecciona...</option>
                <For each={vehicleLocations()?.data}>{(l) => <option value={l._id}>{l.code}</option>}</For>
              </select>
              <Show when={vehicleLocations() && vehicleLocations().data.length === 0}>
                <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  No hay ubicaciones tipo vehículo creadas. Crea una desde Almacenes → Ubicaciones (tipo "Vehículo").
                </p>
              </Show>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de traslado
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={transferDate()}
                onInput={(e) => setTransferDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Productos a trasladar</p>
              <button type="button" onClick={addLine} class="btn-secondary text-xs px-3 py-1.5">
                + Agregar línea
              </button>
            </div>
            <div class="space-y-3">
              <For each={lines()}>
                {(line, index) => (
                  <TransferLineFields
                    line={line}
                    index={index}
                    updateLine={updateLine}
                    removeLine={removeLine}
                    canRemove={lines().length > 1}
                    sourceWarehouse={sourceWarehouse}
                    destinationWarehouse={destinationWarehouse}
                    destinationLocations={destinationLocations}
                    placeableLots={placeableLots}
                  />
                )}
              </For>
            </div>
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

          <div class="flex gap-3 pt-2">
            <button type="button" onClick={props.onClose} class="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading()} class="btn-primary flex-1 disabled:opacity-50">
              {loading() ? "Guardando..." : "Crear traslado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferFormModal;
