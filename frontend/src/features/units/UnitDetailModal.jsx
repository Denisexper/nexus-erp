import { createResource } from "solid-js";
import { unitsApi } from "../../services/units.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function UnitDetailModal(props) {
  const [detail] = createResource(
    () => props.unit?._id,
    (id) => unitsApi.getById(id),
  );

  const unit = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={unit()?.name}
      isActive={unit()?.isActive}
      avatar={
        unit() && <DetailAvatar fallback={unit().name?.charAt(0).toUpperCase()} />
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Nombre" value={unit()?.name} />
        <DetailField label="Tipo" value={unit()?.type} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            unit()?.createdAt &&
            new Date(unit().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            unit()?.updatedAt &&
            new Date(unit().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default UnitDetailModal;
