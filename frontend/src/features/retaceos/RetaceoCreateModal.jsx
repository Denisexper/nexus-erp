import { createSignal, createResource, createMemo, Show, For } from "solid-js";
import { retaceosApi } from "../../services/retaceos.api";
import { purchaseOrdersApi } from "../../services/purchaseOrders.api";
import { showToast } from "../../utils/toast";
import { formatMoney } from "./statusMeta";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Simulación del mismo prorrateo que hace el backend (createRetaceo.js):
// puramente informativa, para que el usuario vea el costo real antes de
// enviar. El backend recalcula todo de nuevo, esto no se envía tal cual.
const buildPreview = (order, totalFreight, totalDai) => {
  if (!order) return null;

  const totalFob = order.subtotal;
  const freight = round2(totalFreight);
  const dai = round2(totalDai);
  const expenses = round2(order.additionalExpenses);

  const lines = order.details.map((detail) => ({
    product: detail.product,
    quantity: detail.quantity,
    costFob: detail.subtotal,
    ratio: totalFob ? detail.subtotal / totalFob : 0,
  }));

  let freightAssigned = 0;
  let expensesAssigned = 0;
  let daiAssigned = 0;

  const details = lines.map((line, index) => {
    const isLast = index === lines.length - 1;

    const freightAmount = isLast ? round2(freight - freightAssigned) : round2(line.ratio * freight);
    const expenseAmount = isLast ? round2(expenses - expensesAssigned) : round2(line.ratio * expenses);
    const daiAmount = isLast ? round2(dai - daiAssigned) : round2(line.ratio * dai);

    freightAssigned = round2(freightAssigned + freightAmount);
    expensesAssigned = round2(expensesAssigned + expenseAmount);
    daiAssigned = round2(daiAssigned + daiAmount);

    const totalCost = round2(line.costFob + freightAmount + expenseAmount + daiAmount);
    const unitCost = line.quantity ? round2(totalCost / line.quantity) : 0;

    return { ...line, freightAmount, expenseAmount, daiAmount, totalCost, unitCost };
  });

  return {
    totalFob,
    totalFreight: freight,
    totalExpenses: expenses,
    totalDai: dai,
    totalCost: round2(totalFob + freight + expenses + dai),
    details,
  };
};

function RetaceoCreateModal(props) {
  const [selectedOrderId, setSelectedOrderId] = createSignal(props.presetPurchaseOrder?._id || "");
  const [retaceoDate, setRetaceoDate] = createSignal("");
  const [originCountry, setOriginCountry] = createSignal("");
  const [importInvoiceNumber, setImportInvoiceNumber] = createSignal("");
  const [importInvoiceDate, setImportInvoiceDate] = createSignal("");
  const [importPolicyNumber, setImportPolicyNumber] = createSignal("");
  const [importPolicyDate, setImportPolicyDate] = createSignal("");
  const [totalFreight, setTotalFreight] = createSignal("");
  const [totalDai, setTotalDai] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const isPreset = () => !!props.presetPurchaseOrder;

  // Solo se listan órdenes 'approved': es el único estado desde el que el
  // backend permite registrar un retaceo (RN-011/RN-012).
  const [orderOptions] = createResource(() =>
    isPreset() ? null : purchaseOrdersApi.getAll({ status: "approved", limit: 1000 }),
  );

  const [orderDetail] = createResource(
    () => selectedOrderId() || undefined,
    (id) => purchaseOrdersApi.getById(id),
  );
  const order = () => orderDetail()?.data;

  const preview = createMemo(() => buildPreview(order(), totalFreight() || 0, totalDai() || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedOrderId()) {
      setError("Selecciona una orden de compra aprobada.");
      return;
    }

    setLoading(true);

    const payload = {
      purchaseOrder: selectedOrderId(),
      retaceoDate: retaceoDate(),
      originCountry: originCountry(),
      importInvoiceNumber: importInvoiceNumber(),
      importInvoiceDate: importInvoiceDate(),
      importPolicyNumber: importPolicyNumber(),
      importPolicyDate: importPolicyDate(),
      totalFreight: Number(totalFreight()) || 0,
      totalDai: Number(totalDai()) || 0,
      notes: notes(),
    };

    try {
      await retaceosApi.create(payload);
      showToast.success("Retaceo registrado exitosamente");
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
            Registrar retaceo
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
                Orden de compra aprobada *
              </label>
              <select
                required
                class="input-field w-full"
                value={selectedOrderId()}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={orderOptions()?.data}>
                  {(o) => (
                    <option value={o._id}>
                      {o.code} — {o.supplier?.name} ({formatMoney(o.subtotal, o.currency)} FOB)
                    </option>
                  )}
                </For>
              </select>
              <Show when={orderOptions() && orderOptions().data.length === 0}>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No hay órdenes de compra aprobadas disponibles para retacear.
                </p>
              </Show>
            </div>
          </Show>

          <Show when={order()}>
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                FOB total: {formatMoney(order().subtotal, order().currency)} · Gastos ya registrados:{" "}
                {formatMoney(order().additionalExpenses, order().currency)}
              </p>
              <div class="space-y-1">
                <For each={order().details}>
                  {(line) => (
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-300">
                        {line.product?.name} ({line.quantity})
                      </span>
                      <span class="font-medium">{formatMoney(line.subtotal, order().currency)}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de retaceo
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={retaceoDate()}
                onInput={(e) => setRetaceoDate(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                País de origen
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={originCountry()}
                onInput={(e) => setOriginCountry(e.target.value)}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No. factura de importación
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={importInvoiceNumber()}
                onInput={(e) => setImportInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de factura
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={importInvoiceDate()}
                onInput={(e) => setImportInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No. póliza de importación
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={importPolicyNumber()}
                onInput={(e) => setImportPolicyNumber(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de póliza
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={importPolicyDate()}
                onInput={(e) => setImportPolicyDate(e.target.value)}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Flete *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                class="input-field w-full"
                value={totalFreight()}
                onInput={(e) => setTotalFreight(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DAI (derechos arancelarios) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                class="input-field w-full"
                value={totalDai()}
                onInput={(e) => setTotalDai(e.target.value)}
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

          <Show when={preview()}>
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa del costo real por producto
              </p>
              <div class="overflow-x-auto -mx-1">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                      <th class="px-1 py-1.5">Producto</th>
                      <th class="px-1 py-1.5">FOB</th>
                      <th class="px-1 py-1.5">Flete</th>
                      <th class="px-1 py-1.5">Gastos</th>
                      <th class="px-1 py-1.5">DAI</th>
                      <th class="px-1 py-1.5">Costo unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={preview().details}>
                      {(line) => (
                        <tr class="border-t border-gray-100 dark:border-white/5">
                          <td class="px-1 py-1.5 text-[#29343E] dark:text-white font-medium">
                            {line.product?.name || "-"}
                          </td>
                          <td class="px-1 py-1.5">{formatMoney(line.costFob, order()?.currency)}</td>
                          <td class="px-1 py-1.5">{formatMoney(line.freightAmount, order()?.currency)}</td>
                          <td class="px-1 py-1.5">{formatMoney(line.expenseAmount, order()?.currency)}</td>
                          <td class="px-1 py-1.5">{formatMoney(line.daiAmount, order()?.currency)}</td>
                          <td class="px-1 py-1.5 font-medium">{formatMoney(line.unitCost, order()?.currency)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <div class="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between font-semibold text-[#29343E] dark:text-white">
                <span>Costo total</span>
                <span>{formatMoney(preview().totalCost, order()?.currency)}</span>
              </div>
            </div>
          </Show>

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
              {loading() ? "Registrando..." : "Registrar retaceo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RetaceoCreateModal;
