import { createResource } from "solid-js";
import { employeesApi } from "../../services/employees.api";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function EmployeeDetailModal(props) {
  const [detail] = createResource(
    () => props.employee?._id,
    (id) => employeesApi.getById(id),
  );

  const employee = () => detail()?.data;

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={employee() && `${employee().firstName} ${employee().lastName}`}
      subtitle={employee()?.position}
      isActive={employee()?.isActive}
      avatar={
        employee() && (
          <DetailAvatar fallback={employee().firstName?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Nombre" value={employee()?.firstName} />
        <DetailField label="Apellido" value={employee()?.lastName} />
        <DetailField label="DUI" value={employee()?.dui} />
        <DetailField label="Cargo" value={employee()?.position} />
        <DetailField label="Sucursal" value={employee()?.branch?.name} />
        <DetailField label="Correo" value={employee()?.email} />
        <DetailField label="Teléfono" value={employee()?.phone} />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creado"
          value={
            employee()?.createdAt &&
            new Date(employee().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            employee()?.updatedAt &&
            new Date(employee().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default EmployeeDetailModal;
