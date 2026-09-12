import { createResource, Show, For } from "solid-js";
import { retaceosApi } from "../../services/retaceos.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";
import { statusLabel, statusBadgeClass, formatMoney } from "./statusMeta";

function RetaceoDetailModal(props) {
  const [detail] = createResource(
    () => props.retaceo?._id,
    (id) => retaceosApi.getById(id),
  );
  const retaceo = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={retaceo()?.code}
      subtitle={retaceo() && statusLabel(retaceo().status)}
      avatar={retaceo() && <DetailAvatar fallback="RT" />}
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Orden de compra" value={retaceo()?.purchaseOrder?.code} />
        <DetailField label="Proveedor" value={retaceo()?.supplier?.name} />
        <DetailField label="País de origen" value={retaceo()?.originCountry} />
        <DetailField
          label="Fecha de retaceo"
          value={retaceo()?.retaceoDate && new Date(retaceo().retaceoDate).toLocaleDateString("es-ES")}
        />
        <DetailField label="No. factura de importación" value={retaceo()?.importInvoiceNumber} />
        <DetailField
          label="Fecha de factura"
          value={retaceo()?.importInvoiceDate && new Date(retaceo().importInvoiceDate).toLocaleDateString("es-ES")}
        />
        <DetailField label="No. póliza de importación" value={retaceo()?.importPolicyNumber} />
        <DetailField
          label="Fecha de póliza"
          value={retaceo()?.importPolicyDate && new Date(retaceo().importPolicyDate).toLocaleDateString("es-ES")}
        />
        <DetailField
          label="Estado"
          value={
            <span class={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadgeClass(retaceo()?.status)}`}>
              {statusLabel(retaceo()?.status)}
            </span>
          }
        />
        <DetailField label="Notas" full value={retaceo()?.notes} />
      </DetailSection>

      <DetailSection title="Distribución por producto" cols={1} divider>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 dark:text-night-400 uppercase tracking-wider">
                <th class="px-1 py-2">Producto</th>
                <th class="px-1 py-2">Cantidad</th>
                <th class="px-1 py-2">FOB</th>
                <th class="px-1 py-2">Flete</th>
                <th class="px-1 py-2">Gastos</th>
                <th class="px-1 py-2">DAI</th>
                <th class="px-1 py-2">Costo unit.</th>
              </tr>
            </thead>
            <tbody>
              <For each={retaceo()?.details}>
                {(line) => (
                  <tr class="border-t border-gray-100 dark:border-white/5">
                    <td class="px-1 py-2 text-[#29343E] dark:text-white font-medium">
                      {line.product?.name || "-"}
                    </td>
                    <td class="px-1 py-2">{line.quantity}</td>
                    <td class="px-1 py-2">{formatMoney(line.costFob)}</td>
                    <td class="px-1 py-2">{formatMoney(line.freightAmount)}</td>
                    <td class="px-1 py-2">{formatMoney(line.expenseAmount)}</td>
                    <td class="px-1 py-2">{formatMoney(line.daiAmount)}</td>
                    <td class="px-1 py-2 font-medium">{formatMoney(line.unitCost)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <div class="pt-3 border-t border-gray-100 dark:border-white/5 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">FOB total</span>
            <span>{formatMoney(retaceo()?.totalFob)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Flete</span>
            <span>{formatMoney(retaceo()?.totalFreight)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">Gastos</span>
            <span>{formatMoney(retaceo()?.totalExpenses)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-night-400">DAI</span>
            <span>{formatMoney(retaceo()?.totalDai)}</span>
          </div>
          <div class="flex justify-between font-semibold text-[#29343E] dark:text-white pt-1">
            <span>Costo total</span>
            <span>{formatMoney(retaceo()?.totalCost)}</span>
          </div>
        </div>
      </DetailSection>
    </DetailModal>
  );
}

export default RetaceoDetailModal;
