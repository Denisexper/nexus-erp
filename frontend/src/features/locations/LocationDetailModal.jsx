import { createResource } from "solid-js";
import { locationsApi } from "../../services/locations.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function LocationDetailModal(props) {
  const [detail] = createResource(
    () => props.location?._id,
    (id) => locationsApi.getById(id),
  );

  const location = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={location()?.code}
      subtitle={location()?.warehouse?.name}
      isActive={location()?.isActive}
      avatar={
        location() && (
          <DetailAvatar fallback={location().code?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Código" value={location()?.code} />
        <DetailField label="Almacén" value={location()?.warehouse?.name} />
      </DetailSection>

      <DetailSection title="Coordenadas" cols={3}>
        <DetailField label="Pasillo" value={location()?.aisle} />
        <DetailField label="Estante" value={location()?.rack} />
        <DetailField label="Nivel" value={location()?.level} />
        <DetailField label="Posición" value={location()?.position} />
        <DetailField label="Capacidad" value={location()?.capacity} />
        <DetailField label="Notas" value={location()?.notes} full />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            location()?.createdAt &&
            new Date(location().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            location()?.updatedAt &&
            new Date(location().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default LocationDetailModal;
