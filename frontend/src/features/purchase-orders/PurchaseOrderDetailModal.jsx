import { createSignal, createResource, Show, For } from "solid-js";
import { purchaseOrdersApi } from "../../services/purchaseOrders.api";
import { expenseTypesApi } from "../../services/expenseTypes.api";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";

// Estados desde los que todavía tiene sentido registrar un gasto (CU-086):
// una orden ya cancelada o cerrada no admite más movimientos.
const EXPENSE_ADDABLE_STATUSES = ["draft", "approved", "sent", "partially_received", "received"];

function PurchaseOrderDetailModal(props) {
  const auth = useAuth();

  const [detail, { refetch }] = createResource(
    () => props.purchaseOrder?._id,
    (id) => purchaseOrdersApi.getById(id),
  );
  const order = () => detail()?.data;

  const [actionLoading, setActionLoading] = createSignal(false);

  const notifyChanged = () => {
    refetch();
    props.onChanged?.();
  };

  const runAction = (label, action, confirmMsg) => {
    showToast.confirm(confirmMsg, async () => {
      setActionLoading(true);
      try {
        await action();
        notifyChanged();
        showToast.success(label);
      } catch (error) {
        showToast.error(error.message);
      }
      setActionLoading(false);
    });
  };

  const approve = () =>
    runAction(
      "Orden aprobada correctamente",
      () => purchaseOrdersApi.approve(order()._id),
      "¿Aprobar esta orden de compra?",
    );

  const cancel = () =>
    runAction(
      "Orden cancelada correctamente",
      () => purchaseOrdersApi.cancel(order()._id),
      "¿Cancelar esta orden? La cotización de origen vuelve a estar disponible.",
    );

  // --- Registrar gasto (CU-086) ---
  const [showExpenseForm, setShowExpenseForm] = createSignal(false);
  const [expenseType, setExpenseType] = createSignal("");
  const [expenseDescription, setExpenseDescription] = createSignal("");
  const [expenseAmount, setExpenseAmount] = createSignal("");
  const [expenseError, setExpenseError] = createSignal("");
  const [expenseSaving, setExpenseSaving] = createSignal(false);

  const [expenseTypes] = createResource(() => expenseTypesApi.getAll({ isActive: true, limit: 1000 }));

  const submitExpense = async (e) => {
    e.preventDefault();
    setExpenseError("");
    setExpenseSaving(true);
    try {
      await purchaseOrdersApi.addExpense(order()._id, {
        expenseType: expenseType(),
        description: expenseDescription(),
        amount: Number(expenseAmount()) || 0,
      });
      showToast.success("Gasto registrado correctamente");
      setExpenseType("");
      setExpenseDescription("");
      setExpenseAmount("");
      setShowExpenseForm(false);
      notifyChanged();
    } catch (error) {
      setExpenseError(error.message);
      showToast.error(error.message);
    }
    setExpenseSaving(false);
  };

  // --- Trazabilidad (CU-087) ---
  const [showTraceability, setShowTraceability] = createSignal(false);
  const [traceability] = createResource(
    () => (showTraceability() ? order()?._id : undefined),
    (id) => purchaseOrdersApi.getTraceability(id),
  );

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={order()?.code}
      subtitle={order() && statusLabel(order().status)}
      avatar={order() && <DetailAvatar fallback="OC" />}
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Proveedor" value={order()?.supplier?.name} />
        <DetailField label="Cotización de origen" value={order()?.purchaseQuotation?.code} />
        <DetailField label="Sucursal" value={order()?.branch?.name} />
        <DetailField label="Almacén destino" value={order()?.warehouse?.name} />
        <DetailField
          label="Fecha de orden"
          value={order()?.orderDate && new Date(order().orderDate).toLocaleDateString("es-ES")}
        />
        <DetailField
          label="Fecha esperada"
          value={order()?.expectedDate && new Date(order().expectedDate).toLocaleDateString("es-ES")}
        />
        <DetailField label="Condiciones de pago" value={order()?.paymentTerms} />
        <DetailField
          label="Estado"
          value={
            <span class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(order()?.status)}`}>
              {statusLabel(order()?.status)}
            </span>
          }
        />
        <DetailField label="Notas" full value={order()?.notes} />
      </DetailSection>

      <DetailSection title="Acciones" cols={1} divider>
        <div class="flex flex-wrap gap-2">
          <Show when={order()?.status === "draft" && auth.hasPermission("purchase_orders.approve")}>
            <button disabled={actionLoading()} onClick={approve} class="text-xs px-3 py-1.5 rounded-md border border-mint-600/30 text-mint-700 dark:text-mint hover:bg-mint-600/10 transition-colors disabled:opacity-50">
              Aprobar
            </button>
          </Show>
          <Show when={["draft", "approved"].includes(order()?.status) && auth.hasPermission("purchase_orders.cancel")}>
            <button disabled={actionLoading()} onClick={cancel} class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50">
              Cancelar orden
            </button>
          </Show>
          <Show when={EXPENSE_ADDABLE_STATUSES.includes(order()?.status) && auth.hasPermission("purchase_orders.update")}>
            <button onClick={() => setShowExpenseForm((v) => !v)} class="text-xs px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
              + Registrar gasto
            </button>
          </Show>
          <button onClick={() => setShowTraceability((v) => !v)} class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors">
            {showTraceability() ? "Ocultar trazabilidad" : "Ver trazabilidad"}
          </button>
          <Show
            when={
              !["draft", "approved"].includes(order()?.status) &&
              !EXPENSE_ADDABLE_STATUSES.includes(order()?.status)
            }
          >
            <p class="text-xs text-gray-500 dark:text-night-400">No hay más acciones disponibles.</p>
          </Show>
        </div>

        <Show when={showExpenseForm()}>
          <form onSubmit={submitExpense} class="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-start bg-gray-50 dark:bg-white/5 rounded-lg p-3">
            <select required class="input-field text-sm" value={expenseType()} onChange={(e) => setExpenseType(e.target.value)}>
              <option value="">Tipo de gasto...</option>
              <For each={expenseTypes()?.data}>{(et) => <option value={et._id}>{et.name}</option>}</For>
            </select>
            <input type="text" class="input-field text-sm" placeholder="Descripción" value={expenseDescription()} onInput={(e) => setExpenseDescription(e.target.value)} />
            <input type="number" required min="0" step="0.01" class="input-field text-sm" placeholder="Monto" value={expenseAmount()} onInput={(e) => setExpenseAmount(e.target.value)} />
            <button type="submit" disabled={expenseSaving()} class="btn-primary text-sm disabled:opacity-50">
              {expenseSaving() ? "Guardando..." : "Guardar"}
            </button>
            <Show when={expenseError()}>
              <p class="text-xs text-coral-600 dark:text-coral md:col-span-4">{expenseError()}</p>
            </Show>
          </form>
        </Show>

        <Show when={showTraceability()}>
          <div class="mt-3 bg-gray-50 dark:bg-white/5 rounded-lg p-3">
            <Show when={traceability.loading}>
              <p class="text-xs text-gray-500 dark:text-gray-400">Cargando trazabilidad...</p>
            </Show>
            <Show when={traceability()}>
              <div class="text-sm space-y-1">
                <p class="text-gray-500 dark:text-night-400 text-xs uppercase tracking-wider">
                  Orden → Cotización → Solicitudes
                </p>
                <p>
                  <span class="font-medium text-[#29343E] dark:text-white">{order()?.code}</span>
                  <span class="text-gray-400"> ← </span>
                  <span>{traceability().data.quotation?.code || "-"}</span>
                </p>
                <Show
                  when={traceability().data.requests.length > 0}
                  fallback={<p class="text-xs text-gray-500 dark:text-gray-400">Sin solicitudes de origen registradas.</p>}
                >
                  <ul class="list-disc list-inside text-gray-600 dark:text-gray-300">
                    <For each={traceability().data.requests}>
                      {(r) => (
                        <li>
                          {r.code} — {statusLabel(r.status)}
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
              </div>
            </Show>
          </div>
        </Show>
      </DetailSection>

      <DetailSection title="Productos" cols={1} divider>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                <th class="px-1 py-2">Producto</th>
                <th class="px-1 py-2">Cantidad</th>
                <th class="px-1 py-2">Unidad</th>
                <th class="px-1 py-2">Precio unit.</th>
                <th class="px-1 py-2">Impuesto</th>
                <th class="px-1 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <For each={order()?.details}>
                {(line) => (
                  <tr class="border-t border-gray-100 dark:border-white/5">
                    <td class="px-1 py-2 text-[#29343E] dark:text-white font-medium">
                      {line.product?.name || "-"}
                    </td>
                    <td class="px-1 py-2">{line.quantity}</td>
                    <td class="px-1 py-2">{line.unit?.name || "-"}</td>
                    <td class="px-1 py-2">{formatMoney(line.unitPrice, order()?.currency)}</td>
                    <td class="px-1 py-2">{line.taxRate}%</td>
                    <td class="px-1 py-2 font-medium">{formatMoney(line.total, order()?.currency)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={order()?.expenses?.length > 0}>
          <div class="pt-3">
            <p class="text-xs font-semibold text-gray-500 dark:text-night-400 uppercase tracking-wider mb-2">
              Gastos adicionales
            </p>
            <div class="space-y-1">
              <For each={order()?.expenses}>
                {(expense) => (
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-night-300">
                      {expense.expenseType?.name || "-"}
                      <Show when={expense.description}> — {expense.description}</Show>
                    </span>
                    <span class="font-medium text-[#29343E] dark:text-white">
                      {formatMoney(expense.amount, order()?.currency)}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <div class="pt-3 border-t border-gray-100 dark:border-white/5 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Subtotal</span>
            <span>{formatMoney(order()?.subtotal, order()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Impuestos</span>
            <span>{formatMoney(order()?.tax, order()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Gastos adicionales</span>
            <span>{formatMoney(order()?.additionalExpenses, order()?.currency)}</span>
          </div>
          <div class="flex justify-between font-semibold text-[#29343E] dark:text-white pt-1">
            <span>Total</span>
            <span>{formatMoney(order()?.total, order()?.currency)}</span>
          </div>
        </div>
      </DetailSection>
    </DetailModal>
  );
}

export default PurchaseOrderDetailModal;
