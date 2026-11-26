import { createResource } from "solid-js";
import { vehiclesApi } from "../../services/vehicles.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function VehicleDetailModal(props) {
  const [detail] = createResource(
    () => props.vehicle?._id,
    (id) => vehiclesApi.getById(id),
  );

  const vehicle = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={vehicle() && `${vehicle().brand} ${vehicle().model}`}
      subtitle={vehicle()?.plate}
      isActive={vehicle()?.isActive}
      avatar={
        vehicle() && (
          <DetailAvatar fallback={vehicle().brand?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Placa" value={vehicle()?.plate} />
        <DetailField label="Año" value={vehicle()?.year} />
        <DetailField label="Marca" value={vehicle()?.brand} />
        <DetailField label="Modelo" value={vehicle()?.model} />
        <DetailField
          label="Conductor responsable"
          value={
            vehicle()?.employee &&
            `${vehicle().employee.firstName} ${vehicle().employee.lastName}`
          }
        />
        <DetailField label="DUI del conductor" value={vehicle()?.employee?.dui} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            vehicle()?.createdAt &&
            new Date(vehicle().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            vehicle()?.updatedAt &&
            new Date(vehicle().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default VehicleDetailModal;
