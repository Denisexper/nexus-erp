import { createResource, Show, For } from "solid-js";
import { purchaseQuotationDocumentsApi } from "../../services/purchaseQuotationDocuments.api";
import { SERVER_URL } from "../../services/http";

// Comparación visual de hasta 3 cotizaciones lado a lado (plus-feature de
// Denis, no está en la ERS — ver docs/features/README.md), complemento del
// comparador numérico que ya existe (PurchaseQuotationComparisonModal). Cada
// columna muestra todos los adjuntos de esa cotización (puede haber varios:
// PDF + foto), no solo uno.
const MAX_COLUMNS = 3;

const fetchDocumentsByQuotation = async (quotations) => {
  const results = await Promise.all(
    quotations.map((q) => purchaseQuotationDocumentsApi.getByQuotation(q._id)),
  );
  return quotations.map((quotation, i) => ({ quotation, documents: results[i]?.data || [] }));
};

function isImage(fileType) {
  return typeof fileType === "string" && fileType.startsWith("image/");
}

function PurchaseQuotationPdfComparisonModal(props) {
  const quotations = () => props.quotations.slice(0, MAX_COLUMNS);
  const [columns] = createResource(quotations, fetchDocumentsByQuotation);

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-6xl shadow-xl max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Comparación de documentos adjuntos
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Respaldo documental de cada cotización, uno al lado del otro.
            </p>
          </div>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-auto p-6">
          <Show when={columns.loading}>
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">Cargando documentos...</div>
          </Show>

          <Show when={columns.error}>
            <div class="text-center py-8 text-red-500">Error al cargar los documentos</div>
          </Show>

          <Show when={columns()}>
            <div class="grid gap-4" style={{ "grid-template-columns": `repeat(${columns().length}, minmax(260px, 1fr))` }}>
              <For each={columns()}>
                {({ quotation, documents }) => (
                  <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        {quotation.supplier?.name}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{quotation.code}</p>
                    </div>

                    <Show when={documents.length === 0}>
                      <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                        Sin documentos adjuntos.
                      </p>
                    </Show>

                    <div class="space-y-3">
                      <For each={documents}>
                        {(doc) => (
                          <div class="space-y-1">
                            <a
                              href={`${SERVER_URL}/uploads/${doc.filePath}`}
                              target="_blank"
                              rel="noreferrer"
                              class="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
                            >
                              📎 {doc.fileName}
                            </a>
                            <Show when={isImage(doc.fileType)}>
                              <img
                                src={`${SERVER_URL}/uploads/${doc.filePath}`}
                                alt={doc.fileName}
                                class="w-full rounded-md border border-gray-100 dark:border-white/5"
                              />
                            </Show>
                            <Show when={!isImage(doc.fileType)}>
                              <embed
                                src={`${SERVER_URL}/uploads/${doc.filePath}`}
                                type="application/pdf"
                                class="w-full h-80 rounded-md border border-gray-100 dark:border-white/5"
                              />
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
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

export default PurchaseQuotationPdfComparisonModal;
