import { createResource } from "solid-js";
import { categoriesApi } from "../../services/categories.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function CategoryDetailModal(props) {
  const [detail] = createResource(
    () => props.category?._id,
    (id) => categoriesApi.getById(id),
  );

  const category = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={category()?.name}
      isActive={category()?.isActive}
      avatar={
        category() && (
          <DetailAvatar fallback={category().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={1}>
        <DetailField label="Nombre" value={category()?.name} />
        <DetailField label="Descripción" value={category()?.description} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            category()?.createdAt &&
            new Date(category().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            category()?.updatedAt &&
            new Date(category().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default CategoryDetailModal;
