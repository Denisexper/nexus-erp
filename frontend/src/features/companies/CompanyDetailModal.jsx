import { createResource, Show } from "solid-js";
import { companiesApi } from "../../services/companies.api";

function Field(props) {
  return (
    <div>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
        {props.label}
      </p>
      <p class="text-sm text-gray-900 dark:text-white">
        {props.value || "-"}
      </p>
    </div>
  );
}

function CompanyDetailModal(props) {
  const [detail] = createResource(
    () => props.company?._id,
    (id) => companiesApi.getById(id),
  );

  const company = () => detail()?.data;

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle de la empresa
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <Show when={detail.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando empresa...
            </div>
          </Show>

          <Show when={detail.error}>
            <div class="text-center py-8 text-red-500">
              Error al cargar la empresa
            </div>
          </Show>

          <Show when={company()}>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Show
                  when={company().logo}
                  fallback={
                    <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {company().commercialName?.charAt(0).toUpperCase()}
                    </span>
                  }
                >
                  <img
                    src={company().logo}
                    alt=""
                    class="w-full h-full object-cover"
                  />
                </Show>
              </div>
              <div class="flex items-center gap-1.5">
                <span
                  class={`w-1.5 h-1.5 rounded-full ${company().isActive ? "bg-green-500" : "bg-red-500"}`}
                ></span>
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  {company().isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Razón social" value={company().name} />
              <Field label="Nombre comercial" value={company().commercialName} />
              <Field label="NIT" value={company().nit} />
              <Field label="NRC" value={company().nrc} />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Giro comercial principal" value={company().commercialLine1} />
              <Field label="Giro comercial secundario" value={company().commercialLine2} />
              <Field label="Giro comercial adicional" value={company().commercialLine3} />
            </div>

            <Field label="Dirección" value={company().address} />

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Departamento" value={company().department?.name} />
              <Field label="Municipio" value={company().municipality?.name} />
              <Field label="Distrito" value={company().district?.name} />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Teléfono" value={company().phone} />
              <Field label="Correo electrónico" value={company().email} />
              <Field label="Sitio web" value={company().webSite} />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Field
                label="Creada"
                value={
                  company().createdAt &&
                  new Date(company().createdAt).toLocaleString("es-ES")
                }
              />
              <Field
                label="Última actualización"
                value={
                  company().updatedAt &&
                  new Date(company().updatedAt).toLocaleString("es-ES")
                }
              />
            </div>
          </Show>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={props.onClose} class="btn-secondary w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailModal;
