import { createResource } from "solid-js";
import { branchesApi } from "../../services/branches.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function BranchDetailModal(props) {
  const [detail] = createResource(
    () => props.branch?._id,
    (id) => branchesApi.getById(id),
  );

  const branch = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={branch()?.name}
      subtitle={
        branch() &&
        (branch().company?.commercialName || branch().company?.name)
      }
      isActive={branch()?.isActive}
      avatar={
        branch() && <DetailAvatar fallback={branch().name?.charAt(0).toUpperCase()} />
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Nombre" value={branch()?.name} />
        <DetailField
          label="Empresa"
          value={branch()?.company?.commercialName || branch()?.company?.name}
        />
      </DetailSection>

      <DetailSection title="Ubicación" cols={3}>
        <DetailField label="Dirección" value={branch()?.address} full />
        <DetailField label="Departamento" value={branch()?.department?.name} />
        <DetailField label="Municipio" value={branch()?.municipality?.name} />
        <DetailField label="Distrito" value={branch()?.district?.name} />
      </DetailSection>

      <DetailSection title="Contacto" cols={2}>
        <DetailField label="Teléfono" value={branch()?.phone} />
        <DetailField label="Correo electrónico" value={branch()?.email} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            branch()?.createdAt &&
            new Date(branch().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            branch()?.updatedAt &&
            new Date(branch().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default BranchDetailModal;
