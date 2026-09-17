import { createSignal, createResource, createMemo, Show, For } from "solid-js";
import { purchasesApi } from "../../services/purchases.api";
import { purchaseOrdersApi } from "../../services/purchaseOrders.api";
import { showToast } from "../../utils/toast";
import { formatMoney } from "./statusMeta";

// Solo 'approved' y 'partially_received' admiten una recepción nueva
// (RN-008, CA-COM-017/018 del ERS) — mismo criterio que el backend
// (createPurchase.js).
const RECEIVABLE_ORDER_STATUSES = ["approved", "partially_received"];

// Si viene una orden preseleccionada (botón "Registrar recepción" desde el
// detalle de la orden), no se muestra el selector.
function PurchaseCreateModal(props) {
  const isPreset = () => !!props.presetPurchaseOrder;

  const [selectedOrderId, setSelectedOrderId] = createSignal(
    props.presetPurchaseOrder?._id || "",
  );
  const [purchaseDate, setPurchaseDate] = createSignal("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = createSignal("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = createSignal("");
  const [currency, setCurrency] = createSignal("");
  const [notes, setNotes] = createSignal("");

  // cantidad recibida por línea, keyed por purchaseOrderDetail id
  const [quantities, setQuantities] = createSignal({});

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // El backend no soporta filtrar por varios estados a la vez, así que
  // traemos todas las órdenes y filtramos acá las receptables.
  const [orderOptions] = createResource(() =>
    isPreset() ? null : purchaseOrdersApi.getAll({ limit: 1000 }),
  );
  const receivableOrders = () =>
    (orderOptions()?.data || []).filter((o) => RECEIVABLE_ORDER_STATUSES.includes(o.status));

  const [orderDetail] = createResource(
    () => selectedOrderId() || undefined,
    (id) => purchaseOrdersApi.getById(id),
  );
  const order = () => orderDetail()?.data;

  // Recepciones ya registradas contra esta orden, para calcular lo pendiente
  // por línea (el backend valida lo mismo en createPurchase.js, esto es solo
  // para no dejar que el usuario intente recibir de más).
  const [existingPurchases] = createResource(
    () => selectedOrderId() || undefined,
    (id) => purchasesApi.getAll({ purchaseOrder: id, limit: 1000 }),
  );

  const receivedByDetail = createMemo(() => {
    const purchases = (existingPurchases()?.data || []).filter((p) => p.status !== "cancelled");
    const acc = {};
    for (const purchase of purchases) {
      for (const line of purchase.details || []) {
        acc[line.purchaseOrderDetail] = (acc[line.purchaseOrderDetail] || 0) + line.quantityReceived;
      }
    }
    return acc;
  });

  const pendingLines = createMemo(() => {
    const o = order();
    if (!o) return [];
    const received = receivedByDetail();
    return o.details
      .map((detail) => ({
        detail,
        alreadyReceived: received[detail.id] || 0,
        pending: round2(detail.quantity - (received[detail.id] || 0)),
      }))
      .filter((line) => line.pending > 0);
  });

  const setQuantity = (detailId, value) => {
    setQuantities((prev) => ({ ...prev, [detailId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedOrderId()) {
      setError("Selecciona una orden de compra aprobada o parcialmente recibida.");
      return;
    }

    const lines = pendingLines()
      .map((line) => ({
        purchaseOrderDetail: line.detail.id,
        quantityReceived: Number(quantities()[line.detail.id]) || 0,
      }))
      .filter((line) => line.quantityReceived > 0);

    if (lines.length === 0) {
      setError("Ingresa la cantidad recibida de al menos un producto.");
      return;
    }

    setLoading(true);

    const payload = {
      purchaseOrder: selectedOrderId(),
      purchaseDate: purchaseDate(),
      supplierInvoiceNumber: supplierInvoiceNumber(),
      supplierInvoiceDate: supplierInvoiceDate(),
      currency: currency(),
      notes: notes(),
      lines,
    };

    try {
      await purchasesApi.create(payload);
      showToast.success("Recepción registrada exitosamente");
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-3xl shadow-xl max-h-[92vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Registrar recepción
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-5 overflow-y-auto">
          <Show
            when={!isPreset()}
            fallback={
              <div class="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">Orden de compra de origen</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {props.presetPurchaseOrder?.code} — {props.presetPurchaseOrder?.supplier?.name}
                </p>
              </div>
            }
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orden de compra *
              </label>
              <select
                required
                class="input-field w-full"
                value={selectedOrderId()}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={receivableOrders()}>
                  {(o) => (
                    <option value={o._id}>
                      {o.code} — {o.supplier?.name} ({formatMoney(o.total, o.currency)})
                    </option>
                  )}
                </For>
              </select>
              <Show when={orderOptions() && receivableOrders().length === 0}>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No hay órdenes de compra pendientes de recibir.
                </p>
              </Show>
            </div>
          </Show>

          <Show when={order()}>
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cantidad recibida por producto
              </p>
              <Show
                when={pendingLines().length > 0}
                fallback={
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Esta orden ya no tiene cantidades pendientes de recibir.
                  </p>
                }
              >
                <div class="space-y-2">
                  <For each={pendingLines()}>
                    {(line) => (
                      <div class="grid grid-cols-3 gap-2 items-center text-sm">
                        <span class="text-gray-600 dark:text-gray-300 col-span-1">
                          {line.detail.product?.name}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          Pendiente: {line.pending} {line.detail.unit?.name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={line.pending}
                          step="0.01"
                          class="input-field text-sm"
                          placeholder="0"
                          value={quantities()[line.detail.id] || ""}
                          onInput={(e) => setQuantity(line.detail.id, e.target.value)}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de recepción
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={purchaseDate()}
                onInput={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda
              </label>
              <input
                type="text"
                class="input-field w-full"
                placeholder={order()?.currency}
                value={currency()}
                onInput={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No. factura del proveedor
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={supplierInvoiceNumber()}
                onInput={(e) => setSupplierInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de factura
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={supplierInvoiceDate()}
                onInput={(e) => setSupplierInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <input
              type="text"
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
              {loading() ? "Registrando..." : "Registrar recepción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export default PurchaseCreateModal;
