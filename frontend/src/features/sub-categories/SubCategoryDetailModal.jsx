import { createResource } from "solid-js";
import { subCategoriesApi } from "../../services/subCategories.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function SubCategoryDetailModal(props) {
  const [detail] = createResource(
    () => props.subCategory?._id,
    (id) => subCategoriesApi.getById(id),
  );

  const subCategory = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={subCategory()?.name}
      subtitle={subCategory()?.category?.name}
      isActive={subCategory()?.isActive}
      avatar={
        subCategory() && (
          <DetailAvatar fallback={subCategory().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Nombre" value={subCategory()?.name} />
        <DetailField label="Categoría" value={subCategory()?.category?.name} />
        <DetailField label="Descripción" value={subCategory()?.description} full />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            subCategory()?.createdAt &&
            new Date(subCategory().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            subCategory()?.updatedAt &&
            new Date(subCategory().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default SubCategoryDetailModal;
