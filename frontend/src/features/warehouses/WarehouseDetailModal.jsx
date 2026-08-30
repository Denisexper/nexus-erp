import { createResource } from "solid-js";
import { warehousesApi } from "../../services/warehouses.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function WarehouseDetailModal(props) {
  const [detail] = createResource(
    () => props.warehouse?._id,
    (id) => warehousesApi.getById(id),
  );

  const warehouse = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={warehouse()?.name}
      subtitle={warehouse()?.branch?.name}
      isActive={warehouse()?.isActive}
      avatar={
        warehouse() && (
          <DetailAvatar fallback={warehouse().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Nombre" value={warehouse()?.name} />
        <DetailField label="Categoría" value={warehouse()?.warehouseCategory?.name} />
        <DetailField label="Sucursal" value={warehouse()?.branch?.name} />
        <DetailField label="Descripción" value={warehouse()?.description} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            warehouse()?.createdAt &&
            new Date(warehouse().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            warehouse()?.updatedAt &&
            new Date(warehouse().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default WarehouseDetailModal;
