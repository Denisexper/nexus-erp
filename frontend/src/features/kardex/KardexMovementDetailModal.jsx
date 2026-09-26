import { createResource } from "solid-js";
import { kardexApi } from "../../services/kardex.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

const REASON_LABELS = {
  purchase: "Compra",
  sale: "Venta",
  adjustment: "Ajuste",
  transfer: "Transferencia",
  return: "Devolución",
  initial: "Carga inicial",
};

function KardexMovementDetailModal(props) {
  const [detail] = createResource(
    () => props.movement?._id,
    (id) => kardexApi.getMovementById(id),
  );

  const movement = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={movement()?.product?.name}
      subtitle={movement()?.product?.sku}
      avatar={
        movement() && (
          <DetailAvatar
            fallback={movement().type === "in" ? "↓" : "↑"}
          />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Producto" value={movement()?.product?.name} />
        <DetailField label="Ubicación" value={movement()?.location?.code} />
        <DetailField
          label="Tipo"
          value={movement() && (movement().type === "in" ? "Entrada" : "Salida")}
        />
        <DetailField
          label="Motivo"
          value={movement() && (REASON_LABELS[movement().reason] || movement().reason)}
        />
        <DetailField label="Cantidad" value={movement()?.quantity} />
        <DetailField
          label="Fecha"
          value={
            movement()?.createdAt &&
            new Date(movement().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField label="Registrado por" value={movement()?.user?.name} />
      </DetailSection>

      <DetailSection title="Detalle" cols={1} divider>
        <DetailField label="Observaciones" value={movement()?.notes} full />
        <DetailField label="Referencia de transferencia" value={movement()?.transferRef} full />
      </DetailSection>
    </DetailModal>
  );
}

export default KardexMovementDetailModal;
