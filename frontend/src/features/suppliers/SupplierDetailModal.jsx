import { createResource } from "solid-js";
import { suppliersApi } from "../../services/suppliers.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function SupplierDetailModal(props) {
  const [detail] = createResource(
    () => props.supplier?._id,
    (id) => suppliersApi.getById(id),
  );

  const supplier = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={supplier()?.name}
      subtitle={supplier() && `Código: ${supplier().code}`}
      isActive={supplier()?.isActive}
      avatar={
        supplier() && (
          <DetailAvatar fallback={supplier().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Código" value={supplier()?.code} />
        <DetailField label="Nombre" value={supplier()?.name} />
        <DetailField label="País" value={supplier()?.country?.name} />
        <DetailField label="Dirección" value={supplier()?.address} />
      </DetailSection>

      <DetailSection title="Contacto" cols={3}>
        <DetailField label="Teléfono" value={supplier()?.phone} />
        <DetailField label="Correo electrónico" value={supplier()?.email} />
        <DetailField label="Sitio web" value={supplier()?.website} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            supplier()?.createdAt &&
            new Date(supplier().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            supplier()?.updatedAt &&
            new Date(supplier().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default SupplierDetailModal;
