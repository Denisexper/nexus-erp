import { DetailModal, DetailSection, DetailField, DetailAvatar } from "../../components/DetailModal";

const MOVEMENT_TYPE_LABELS = {
  entry: "Entrada",
  exit: "Salida",
  transfer: "Traslado",
  return: "Devolución",
  adjustment: "Ajuste",
};

const REFERENCE_TYPE_LABELS = {
  purchase: "Compra",
  sale: "Venta",
  transfer: "Traslado",
  return: "Devolución",
  adjustment: "Ajuste",
};

// Vista de detalle de un movimiento (Fase 4): no hace ningún fetch extra,
// la fila de la tabla de Kardex ya trae todos estos campos — solo faltaba
// un lugar donde mostrarlos completos (unitCost/totalCost, referencia de
// origen, usuario), que no entran en la tabla.
function InventoryMovementDetailModal(props) {
  const movement = () => props.movement;

  return (
    <DetailModal
      onClose={props.onClose}
      title={MOVEMENT_TYPE_LABELS[movement()?.movementType] || movement()?.movementType}
      subtitle={movement()?.inventoryLot?.lotCode}
      avatar={<DetailAvatar fallback={(MOVEMENT_TYPE_LABELS[movement()?.movementType] || "?").charAt(0)} />}
    >
      <DetailSection title="Movimiento" cols={2}>
        <DetailField
          label="Fecha"
          value={movement()?.movementDate && new Date(movement().movementDate).toLocaleString("es-ES")}
        />
        <DetailField label="Tipo" value={MOVEMENT_TYPE_LABELS[movement()?.movementType] || movement()?.movementType} />
        <DetailField label="Producto" value={movement()?.product?.name} />
        <DetailField label="Código interno" value={movement()?.product?.internalCode} />
        <DetailField label="Lote" value={movement()?.inventoryLot?.lotCode} />
        <DetailField label="Almacén" value={movement()?.warehouse?.name} />
        <DetailField label="Ubicación" value={movement()?.location?.code} />
        <DetailField label="Usuario" value={movement()?.user?.name} />
      </DetailSection>

      <DetailSection title="Cantidades y costo" cols={2} divider>
        <DetailField label="Entrada" value={movement()?.quantityIn > 0 ? movement().quantityIn : "-"} />
        <DetailField label="Salida" value={movement()?.quantityOut > 0 ? movement().quantityOut : "-"} />
        <DetailField label="Costo unitario" value={movement()?.unitCost != null && `$${movement().unitCost.toFixed(2)}`} />
        <DetailField label="Costo total" value={movement()?.totalCost != null && `$${movement().totalCost.toFixed(2)}`} />
      </DetailSection>

      <DetailSection title="Origen" cols={2} divider>
        <DetailField
          label="Tipo de documento"
          value={REFERENCE_TYPE_LABELS[movement()?.referenceType] || movement()?.referenceType}
        />
        <DetailField label="ID de documento" value={movement()?.referenceId} />
        <DetailField
          label="Registrado"
          value={movement()?.createdAt && new Date(movement().createdAt).toLocaleString("es-ES")}
        />
      </DetailSection>
    </DetailModal>
  );
}

export default InventoryMovementDetailModal;
