import { createResource } from "solid-js";
import { expenseTypesApi } from "../../services/expenseTypes.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function ExpenseTypeDetailModal(props) {
  const [detail] = createResource(
    () => props.expenseType?._id,
    (id) => expenseTypesApi.getById(id),
  );

  const expenseType = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={expenseType()?.name}
      isActive={expenseType()?.isActive}
      avatar={
        expenseType() && (
          <DetailAvatar fallback={expenseType().name?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={1}>
        <DetailField label="Nombre" value={expenseType()?.name} />
        <DetailField label="Descripción" value={expenseType()?.description} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            expenseType()?.createdAt &&
            new Date(expenseType().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            expenseType()?.updatedAt &&
            new Date(expenseType().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default ExpenseTypeDetailModal;
