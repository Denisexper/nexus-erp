import { createResource } from "solid-js";
import { companiesApi } from "../../services/companies.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function CompanyDetailModal(props) {
  const [detail] = createResource(
    () => props.company?._id,
    (id) => companiesApi.getById(id),
  );

  const company = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={company()?.commercialName}
      subtitle={company() && `NIT: ${company().nit}`}
      isActive={company()?.isActive}
      avatar={
        company() && (
          <DetailAvatar
            src={company().logo}
            fallback={company().commercialName?.charAt(0).toUpperCase()}
          />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Razón social" value={company()?.name} />
        <DetailField label="Nombre comercial" value={company()?.commercialName} />
        <DetailField label="NIT" value={company()?.nit} />
        <DetailField label="NRC" value={company()?.nrc} />
      </DetailSection>

      <DetailSection title="Giros comerciales" cols={3}>
        <DetailField label="Principal" value={company()?.commercialLine1} />
        <DetailField label="Secundario" value={company()?.commercialLine2} />
        <DetailField label="Adicional" value={company()?.commercialLine3} />
      </DetailSection>

      <DetailSection title="Ubicación" cols={3}>
        <DetailField label="Dirección" value={company()?.address} full />
        <DetailField label="Departamento" value={company()?.department?.name} />
        <DetailField label="Municipio" value={company()?.municipality?.name} />
        <DetailField label="Distrito" value={company()?.district?.name} />
      </DetailSection>

      <DetailSection title="Contacto" cols={3}>
        <DetailField label="Teléfono" value={company()?.phone} />
        <DetailField label="Correo electrónico" value={company()?.email} />
        <DetailField label="Sitio web" value={company()?.webSite} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            company()?.createdAt &&
            new Date(company().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            company()?.updatedAt &&
            new Date(company().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default CompanyDetailModal;
