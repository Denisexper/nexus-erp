import { createResource } from "solid-js";
import { productsApi } from "../../services/products.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function ProductDetailModal(props) {
  const [detail] = createResource(
    () => props.product?._id,
    (id) => productsApi.getById(id),
  );

  const product = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={product()?.name}
      subtitle={product() && `Código: ${product().internalCode}`}
      isActive={product()?.isActive}
      avatar={
        product() && (
          <DetailAvatar fallback={product().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={3}>
        <DetailField label="Código interno" value={product()?.internalCode} />
        <DetailField label="SKU" value={product()?.sku} />
        <DetailField label="Código original" value={product()?.originalCode} />
        <DetailField label="Nombre" value={product()?.name} full />
      </DetailSection>

      <DetailSection title="Clasificación" cols={2}>
        <DetailField label="Categoría" value={product()?.category?.name} />
        <DetailField label="Sub-categoría" value={product()?.subCategory?.name} />
      </DetailSection>

      <DetailSection title="Unidades" cols={2}>
        <DetailField label="Unidad de compra" value={product()?.purchaseUnit?.name} />
        <DetailField label="Unidad de venta" value={product()?.saleUnit?.name} />
      </DetailSection>

      <DetailSection title="Presentación" cols={3}>
        <DetailField label="Tamaño" value={product()?.size} />
        <DetailField label="Dimensiones" value={product()?.dimensions} />
        <DetailField label="Presentación" value={product()?.presentation} />
        <DetailField label="Descripción" value={product()?.description} full />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            product()?.createdAt &&
            new Date(product().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            product()?.updatedAt &&
            new Date(product().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default ProductDetailModal;
