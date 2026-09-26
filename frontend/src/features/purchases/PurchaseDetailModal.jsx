import { createSignal, createResource, Show, For } from "solid-js";
import { purchasesApi } from "../../services/purchases.api";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";

function PurchaseDetailModal(props) {
  const auth = useAuth();

  const [detail, { refetch }] = createResource(
    () => props.purchase?._id,
    (id) => purchasesApi.getById(id),
  );
  const purchase = () => detail()?.data;

  const [actionLoading, setActionLoading] = createSignal(false);

  const notifyChanged = () => {
    refetch();
    props.onChanged?.();
  };

  const cancel = () => {
    showToast.confirm(
      "¿Cancelar esta compra? La orden de origen recalcula su estado de recepción.",
      async () => {
        setActionLoading(true);
        try {
          await purchasesApi.cancel(purchase()._id);
          notifyChanged();
          showToast.success("Compra cancelada correctamente");
        } catch (error) {
          showToast.error(error.message);
        }
        setActionLoading(false);
      },
    );
  };

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={purchase()?.code}
      subtitle={purchase() && statusLabel(purchase().status)}
      avatar={purchase() && <DetailAvatar fallback="RC" />}
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Orden de compra" value={purchase()?.purchaseOrder?.code} />
        <DetailField label="Proveedor" value={purchase()?.supplier?.name} />
        <DetailField label="Sucursal" value={purchase()?.branch?.name} />
        <DetailField label="Almacén destino" value={purchase()?.warehouse?.name} />
        <DetailField
          label="Fecha de recepción"
          value={purchase()?.purchaseDate && new Date(purchase().purchaseDate).toLocaleDateString("es-ES")}
        />
        <DetailField label="No. factura del proveedor" value={purchase()?.supplierInvoiceNumber} />
        <DetailField
          label="Fecha de factura"
          value={purchase()?.supplierInvoiceDate && new Date(purchase().supplierInvoiceDate).toLocaleDateString("es-ES")}
        />
        <DetailField
          label="Estado"
          value={
            <span class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(purchase()?.status)}`}>
              {statusLabel(purchase()?.status)}
            </span>
          }
        />
        <DetailField label="Notas" full value={purchase()?.notes} />
      </DetailSection>

      <Show when={purchase()?.status === "received" && auth.hasPermission("purchases.cancel")}>
        <DetailSection title="Acciones" cols={1} divider>
          <div class="flex flex-wrap gap-2">
            <button
              disabled={actionLoading()}
              onClick={cancel}
              class="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar compra
            </button>
          </div>
        </DetailSection>
      </Show>

      <DetailSection title="Productos recibidos" cols={1} divider>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                <th class="px-1 py-2">Producto</th>
                <th class="px-1 py-2">Ordenado</th>
                <th class="px-1 py-2">Recibido</th>
                <th class="px-1 py-2">Unidad</th>
                <th class="px-1 py-2">Precio unit.</th>
                <th class="px-1 py-2">Impuesto</th>
                <th class="px-1 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <For each={purchase()?.details}>
                {(line) => (
                  <tr class="border-t border-gray-100 dark:border-white/5">
                    <td class="px-1 py-2 text-[#29343E] dark:text-white font-medium">
                      {line.product?.name || "-"}
                    </td>
                    <td class="px-1 py-2">{line.quantityOrdered}</td>
                    <td class="px-1 py-2">{line.quantityReceived}</td>
                    <td class="px-1 py-2">{line.unit?.name || "-"}</td>
                    <td class="px-1 py-2">{formatMoney(line.unitPrice, purchase()?.currency)}</td>
                    <td class="px-1 py-2">{line.taxRate}%</td>
                    <td class="px-1 py-2 font-medium">{formatMoney(line.total, purchase()?.currency)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <div class="pt-3 border-t border-gray-100 dark:border-white/5 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Subtotal</span>
            <span>{formatMoney(purchase()?.subtotal, purchase()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Descuento</span>
            <span>{formatMoney(purchase()?.discount, purchase()?.currency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Impuestos</span>
            <span>{formatMoney(purchase()?.tax, purchase()?.currency)}</span>
          </div>
          <div class="flex justify-between font-semibold text-[#29343E] dark:text-white pt-1">
            <span>Total</span>
            <span>{formatMoney(purchase()?.total, purchase()?.currency)}</span>
          </div>
        </div>
      </DetailSection>
    </DetailModal>
  );
}

export default PurchaseDetailModal;
