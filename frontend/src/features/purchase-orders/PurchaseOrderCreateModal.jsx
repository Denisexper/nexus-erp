import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { purchaseOrdersApi } from "../../services/purchaseOrders.api";
import { purchaseQuotationsApi } from "../../services/purchaseQuotations.api";
import { branchesApi } from "../../services/branches.api";
import { warehousesApi } from "../../services/warehouses.api";
import { showToast } from "../../utils/toast";
import { formatMoney } from "./statusMeta";

// Si viene una cotización preseleccionada (botón "Generar orden de compra"
// desde el detalle de la cotización), no se muestra el selector: la orden se
// genera fija sobre esa cotización, igual que la pantalla 6.8.24 del ERS
// ("el usuario podrá seleccionar una cotización y posteriormente generar la
// orden de compra").
function PurchaseOrderCreateModal(props) {
  const isPreset = () => !!props.presetQuotation;

  const [selectedQuotationId, setSelectedQuotationId] = createSignal(
    props.presetQuotation?._id || "",
  );
  const [branch, setBranch] = createSignal("");
  const [warehouse, setWarehouse] = createSignal("");
  const [expectedDate, setExpectedDate] = createSignal("");
  const [currency, setCurrency] = createSignal("");
  const [paymentTerms, setPaymentTerms] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Solo se listan cotizaciones 'received': es el único estado desde el que
  // el backend permite generar una orden (RN-COM-010).
  const [quotationOptions] = createResource(() =>
    isPreset() ? null : purchaseQuotationsApi.getAll({ status: "received", limit: 1000 }),
  );

  const [quotationDetail] = createResource(
    () => selectedQuotationId() || undefined,
    (id) => purchaseQuotationsApi.getById(id),
  );
  const quotation = () => quotationDetail()?.data;

  // Precargar moneda/condiciones de pago heredadas de la cotización elegida,
  // pero dejar que el usuario las sobreescriba antes de enviar.
  createEffect(() => {
    const q = quotation();
    if (q) {
      setCurrency(q.currency || "");
      setPaymentTerms(q.paymentTerms || "");
    }
  });

  const [branches] = createResource(() =>
    branchesApi.getAll({ isActive: true, limit: 1000 }),
  );

  const [warehouses] = createResource(
    () => branch() || undefined,
    (branchId) => warehousesApi.getAll({ branch: branchId, isActive: true, limit: 1000 }),
  );

  const handleBranchChange = (value) => {
    setBranch(value);
    setWarehouse("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedQuotationId()) {
      setError("Selecciona una cotización recibida.");
      return;
    }

    setLoading(true);

    const payload = {
      purchaseQuotation: selectedQuotationId(),
      branch: branch(),
      warehouse: warehouse(),
      expectedDate: expectedDate(),
      currency: currency(),
      paymentTerms: paymentTerms(),
      notes: notes(),
    };

    try {
      await purchaseOrdersApi.create(payload);
      showToast.success("Orden de compra creada exitosamente");
      props.onSaved();
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Generar orden de compra
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
                <p class="text-xs text-gray-500 dark:text-gray-400">Cotización de origen</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {props.presetQuotation?.code} — {props.presetQuotation?.supplier?.name}
                </p>
              </div>
            }
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cotización recibida *
              </label>
              <select
                required
                class="input-field w-full"
                value={selectedQuotationId()}
                onChange={(e) => setSelectedQuotationId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <For each={quotationOptions()?.data}>
                  {(q) => (
                    <option value={q._id}>
                      {q.code} — {q.supplier?.name} ({formatMoney(q.total, q.currency)})
                    </option>
                  )}
                </For>
              </select>
              <Show when={quotationOptions() && quotationOptions().data.length === 0}>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No hay cotizaciones recibidas disponibles para generar una orden.
                </p>
              </Show>
            </div>
          </Show>

          <Show when={quotation()}>
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Se copiarán {quotation().details.length} producto(s) y{" "}
                {quotation().expenses.length} gasto(s) de esta cotización
              </p>
              <div class="space-y-1">
                <For each={quotation().details}>
                  {(line) => (
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-300">
                        {line.product?.name} ({line.quantity} {line.unit?.name})
                      </span>
                      <span class="font-medium">{formatMoney(line.total, quotation().currency)}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between font-semibold text-[#29343E] dark:text-white">
                <span>Total</span>
                <span>{formatMoney(quotation().total, quotation().currency)}</span>
              </div>
            </div>
          </Show>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sucursal (recepción) *
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
                Almacén destino *
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha esperada
              </label>
              <input
                type="date"
                class="input-field w-full"
                value={expectedDate()}
                onInput={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda
              </label>
              <input
                type="text"
                class="input-field w-full"
                value={currency()}
                onInput={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Condiciones de pago
            </label>
            <input
              type="text"
              class="input-field w-full"
              value={paymentTerms()}
              onInput={(e) => setPaymentTerms(e.target.value)}
            />
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
              {loading() ? "Generando..." : "Generar orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseOrderCreateModal;
