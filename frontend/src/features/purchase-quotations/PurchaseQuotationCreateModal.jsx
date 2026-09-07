import { createSignal, createResource, createMemo, Show, For } from "solid-js";
import { purchaseQuotationsApi } from "../../services/purchaseQuotations.api";
import { purchaseRequestsApi } from "../../services/purchaseRequests.api";
import { purchaseRequestDetailsApi } from "../../services/purchaseRequestDetails.api";
import { suppliersApi } from "../../services/suppliers.api";
import { expenseTypesApi } from "../../services/expenseTypes.api";
import { showToast } from "../../utils/toast";

// Solicitudes con líneas que todavía admiten cotización (ERS 6.8): aprobadas
// del todo, o parcialmente cotizadas (les faltan líneas por cubrir). El
// backend solo filtra por un status exacto, así que se piden ambos y se
// combinan acá.
const fetchQuotableRequests = async () => {
  const [approved, partiallyQuoted] = await Promise.all([
    purchaseRequestsApi.getAll({ status: "approved", limit: 1000 }),
    purchaseRequestsApi.getAll({ status: "partially_quoted", limit: 1000 }),
  ]);
  return [...(approved.data || []), ...(partiallyQuoted.data || [])];
};

function PurchaseQuotationCreateModal(props) {
  const [supplier, setSupplier] = createSignal("");
  const [validUntil, setValidUntil] = createSignal("");
  const [currency, setCurrency] = createSignal("USD");
  const [paymentTerms, setPaymentTerms] = createSignal("");
  const [deliveryDays, setDeliveryDays] = createSignal("");
  const [notes, setNotes] = createSignal("");

  const [lines, setLines] = createSignal([]);
  const [expenses, setExpenses] = createSignal([]);

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [suppliers] = createResource(() => suppliersApi.getAll({ isActive: true, limit: 1000 }));
  const [expenseTypes] = createResource(() => expenseTypesApi.getAll({ isActive: true, limit: 1000 }));
  const [quotableRequests] = createResource(fetchQuotableRequests);

  // --- "Agregar desde solicitud" ---
  const [pickingRequest, setPickingRequest] = createSignal("");
  const [requestDetails] = createResource(
    () => pickingRequest() || undefined,
    (purchaseRequest) => purchaseRequestDetailsApi.getAll({ purchaseRequest, limit: 1000 }),
  );
  const [checkedSources, setCheckedSources] = createSignal({});

  const toggleSource = (detailId, checked) => {
    setCheckedSources((prev) => ({ ...prev, [detailId]: checked }));
  };

  const requestOptions = createMemo(() => quotableRequests() || []);

  const addCheckedSources = () => {
    const details = requestDetails()?.data || [];
    const picked = details.filter((d) => checkedSources()[d._id]);
    if (picked.length === 0) return;

    setLines((prev) => {
      const next = [...prev];
      for (const detail of picked) {
        const productId = detail.product?._id || detail.product;
        const existing = next.find((l) => l.product === productId);
        const source = {
          purchaseRequestDetail: detail._id,
          quantity: detail.quantity,
          requestCode: requestOptions().find((r) => r._id === pickingRequest())?.code,
          productLabel: detail.product?.name,
          maxQuantity: detail.quantity,
        };

        if (existing) {
          if (!existing.sources.some((s) => s.purchaseRequestDetail === detail._id)) {
            existing.sources = [...existing.sources, source];
          }
        } else {
          next.push({
            product: productId,
            productName: detail.product?.name,
            unit: detail.unit?._id || detail.unit,
            unitName: detail.unit?.name,
            unitPrice: "",
            discount: "",
            taxRate: "",
            deliveryDays: "",
            availableQuantity: "",
            notes: "",
            sources: [source],
          });
        }
      }
      return next;
    });

    setCheckedSources({});
    setPickingRequest("");
  };

  const removeSource = (lineIndex, sourceIdx) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[lineIndex] };
      line.sources = line.sources.filter((_, i) => i !== sourceIdx);
      if (line.sources.length === 0) {
        next.splice(lineIndex, 1);
      } else {
        next[lineIndex] = line;
      }
      return next;
    });
  };

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const lineQuantity = (line) => line.sources.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

  // --- Gastos adicionales ---
  const addExpense = () => {
    setExpenses((prev) => [...prev, { expenseType: "", description: "", amount: "" }]);
  };

  const updateExpense = (index, field, value) => {
    setExpenses((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeExpense = (index) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (lines().length === 0) {
      setError("Agrega al menos un producto desde una solicitud aprobada.");
      return;
    }

    setLoading(true);

    const payload = {
      supplier: supplier(),
      validUntil: validUntil(),
      currency: currency(),
      paymentTerms: paymentTerms(),
      deliveryDays: deliveryDays() ? Number(deliveryDays()) : undefined,
      notes: notes(),
      lines: lines().map((l) => ({
        product: l.product,
        unit: l.unit,
        unitPrice: Number(l.unitPrice),
        discount: Number(l.discount) || 0,
        taxRate: Number(l.taxRate) || 0,
        deliveryDays: l.deliveryDays ? Number(l.deliveryDays) : undefined,
        availableQuantity: l.availableQuantity ? Number(l.availableQuantity) : undefined,
        notes: l.notes,
        sources: l.sources.map((s) => ({ purchaseRequestDetail: s.purchaseRequestDetail, quantity: Number(s.quantity) })),
      })),
      expenses: expenses()
        .filter((exp) => exp.expenseType)
        .map((exp) => ({ expenseType: exp.expenseType, description: exp.description, amount: Number(exp.amount) || 0 })),
    };

    try {
      await purchaseQuotationsApi.create(payload);
      showToast.success("Cotización de compra registrada exitosamente");
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
            Registrar cotización de compra
          </h2>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-6 overflow-y-auto">
          {/* Cabecera */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor *
              </label>
              <select required class="input-field w-full" value={supplier()} onChange={(e) => setSupplier(e.target.value)}>
                <option value="">Seleccionar...</option>
                <For each={suppliers()?.data}>{(s) => <option value={s._id}>{s.name}</option>}</For>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vigente hasta</label>
              <input type="date" class="input-field w-full" value={validUntil()} onInput={(e) => setValidUntil(e.target.value)} />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
              <input type="text" class="input-field w-full" value={currency()} onInput={(e) => setCurrency(e.target.value)} />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condiciones de pago</label>
              <input type="text" class="input-field w-full" placeholder="Ej. Net 30" value={paymentTerms()} onInput={(e) => setPaymentTerms(e.target.value)} />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días de entrega</label>
              <input type="number" min="0" class="input-field w-full" value={deliveryDays()} onInput={(e) => setDeliveryDays(e.target.value)} />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
              <input type="text" class="input-field w-full" value={notes()} onInput={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Agregar productos desde una solicitud aprobada */}
          <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Agregar productos desde una solicitud aprobada
            </p>
            <select
              class="input-field w-full"
              value={pickingRequest()}
              onChange={(e) => {
                setPickingRequest(e.target.value);
                setCheckedSources({});
              }}
            >
              <option value="">Seleccionar solicitud...</option>
              <For each={requestOptions()}>
                {(r) => (
                  <option value={r._id}>
                    {r.code} — {r.branch?.name} / {r.warehouse?.name}
                  </option>
                )}
              </For>
            </select>

            <Show when={pickingRequest()}>
              <Show when={requestDetails.loading}>
                <p class="text-sm text-gray-500 dark:text-gray-400">Cargando líneas...</p>
              </Show>
              <Show when={requestDetails() && requestDetails().data.length === 0}>
                <p class="text-sm text-gray-500 dark:text-gray-400">Esta solicitud no tiene líneas pendientes.</p>
              </Show>
              <Show when={requestDetails() && requestDetails().data.length > 0}>
                <div class="space-y-2">
                  <For each={requestDetails()?.data}>
                    {(detail) => (
                      <label class="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!checkedSources()[detail._id]}
                          onChange={(e) => toggleSource(detail._id, e.target.checked)}
                        />
                        {detail.product?.name} — {detail.quantity} {detail.unit?.name}
                        <Show when={detail.description}>
                          <span class="text-gray-400">({detail.description})</span>
                        </Show>
                      </label>
                    )}
                  </For>
                  <button type="button" onClick={addCheckedSources} class="btn-secondary text-xs px-3 py-1.5">
                    + Agregar seleccionadas
                  </button>
                </div>
              </Show>
            </Show>
          </div>

          {/* Líneas de la cotización */}
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Productos cotizados</p>
            <Show when={lines().length === 0}>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Todavía no agregas productos. Selecciona una solicitud arriba.
              </p>
            </Show>
            <div class="space-y-3">
              <For each={lines()}>
                {(line, index) => (
                  <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
                    <div class="flex justify-between items-center">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {line.productName} — {lineQuantity(line)} {line.unitName}
                      </p>
                    </div>

                    <div class="flex flex-wrap gap-1.5">
                      <For each={line.sources}>
                        {(source, sourceIdx) => (
                          <span class="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            {source.requestCode} · {source.quantity}
                            <button type="button" onClick={() => removeSource(index(), sourceIdx())} class="text-gray-400 hover:text-coral-600">
                              ✕
                            </button>
                          </span>
                        )}
                      </For>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Precio unit. *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          class="input-field w-full text-sm"
                          value={line.unitPrice}
                          onInput={(e) => updateLine(index(), "unitPrice", e.target.value)}
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Descuento</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          class="input-field w-full text-sm"
                          value={line.discount}
                          onInput={(e) => updateLine(index(), "discount", e.target.value)}
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Impuesto %</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          class="input-field w-full text-sm"
                          value={line.taxRate}
                          onInput={(e) => updateLine(index(), "taxRate", e.target.value)}
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Días entrega</label>
                        <input
                          type="number"
                          min="0"
                          class="input-field w-full text-sm"
                          value={line.deliveryDays}
                          onInput={(e) => updateLine(index(), "deliveryDays", e.target.value)}
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Disponible</label>
                        <input
                          type="number"
                          min="0"
                          class="input-field w-full text-sm"
                          value={line.availableQuantity}
                          onInput={(e) => updateLine(index(), "availableQuantity", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Gastos adicionales */}
          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Gastos adicionales</p>
              <button type="button" onClick={addExpense} class="btn-secondary text-xs px-3 py-1.5">
                + Agregar gasto
              </button>
            </div>
            <div class="space-y-2">
              <For each={expenses()}>
                {(expense, index) => (
                  <div class="grid grid-cols-6 gap-2 items-center">
                    <select
                      class="input-field text-sm col-span-2"
                      value={expense.expenseType}
                      onChange={(e) => updateExpense(index(), "expenseType", e.target.value)}
                    >
                      <option value="">Tipo de gasto...</option>
                      <For each={expenseTypes()?.data}>{(et) => <option value={et._id}>{et.name}</option>}</For>
                    </select>
                    <input
                      type="text"
                      class="input-field text-sm col-span-2"
                      placeholder="Descripción"
                      value={expense.description}
                      onInput={(e) => updateExpense(index(), "description", e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="input-field text-sm"
                      placeholder="Monto"
                      value={expense.amount}
                      onInput={(e) => updateExpense(index(), "amount", e.target.value)}
                    />
                    <button type="button" onClick={() => removeExpense(index())} class="text-coral-600 dark:text-coral text-sm">
                      ✕
                    </button>
                  </div>
                )}
              </For>
            </div>
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
              {loading() ? "Guardando..." : "Registrar cotización"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseQuotationCreateModal;
