# Feature: PDF de cotización (generar, subir, comparar)

> Anotado el 2026-10-21 a partir de lo que pidió Denis. Esto NO está en la ERS (se verificó contra `docs/MiniERP ERS v0.8-1.pdf` y `docs/MiniERP ERS v0.9-1.pdf`, cap. 6.8): es un plus-feature de Denis, igual criterio que Kardex/Retaceo en su momento.
>
> **Decisiones confirmadas el 2026-10-25** (quedan resueltas las 3 preguntas de abajo, se mantienen tachadas como referencia): el PDF de solicitud se genera solo desde la vista consolidada (cubre también el caso de 1 sola solicitud tildada); una cotización puede tener **varios** PDFs/imágenes adjuntos (no uno solo); rama `feature/purchase-quotation-pdf-documents`.
>
> **Implementado el 2026-10-25** (backend mergeado a `developer` vía PR #82; frontend en la misma rama, pendiente de mergear). Único detalle que cambió respecto al borrador de abajo: el botón "Comparar PDFs" quedó dentro de `PurchaseQuotationComparisonModal.jsx` (el comparador numérico) en vez de en `PurchaseRequestConsolidatedModal.jsx`, porque esa pantalla ya tiene cargadas las cotizaciones a comparar — ponerlo en la consolidada hubiera obligado a pedir la comparación dos veces.

## Contexto

Hoy el flujo de Compras cotiza registrando a mano los datos de la cotización del proveedor (`PurchaseQuotation` + `PurchaseQuotationDetail`: precios, cantidades, condiciones) y comparándolos de forma numérica (`getPurchaseQuotationsComparison`, ya implementado). La ERS pide exactamente eso — "registrar los productos y condiciones comerciales ofrecidas por los proveedores" — y nunca menciona generar ni adjuntar PDFs para cotizaciones (el único lugar donde la ERS pide adjuntar documentos es en **gastos de orden de compra**, cap. 6.8.20/6.8.42, ya implementado en `purchase-order-expense-documents`).

Denis quiere agregar, encima de eso, un flujo con PDFs reales:

1. **Generar un PDF** de "solicitud de cotización" (RFQ) para mandarle al proveedor — el sistema solo lo genera y lo deja descargar, no envía nada (ni email ni nada automático).
2. **Subir el PDF que el proveedor devuelve** ya cotizado, como adjunto de la `PurchaseQuotation` correspondiente (los datos tipeados a mano siguen siendo obligatorios, esto es solo respaldo documental).
3. **Comparar hasta 3 PDFs** lado a lado, visualmente, además del comparador numérico que ya existe.
4. **Elegir la mejor** — esto ya existe: el status `selected` de `PurchaseQuotation` se setea solo cuando se genera la orden de compra desde esa cotización (`purchase-orders`). No hay nada que construir en este punto.

## Decisiones (confirmadas 2026-10-25)

1. ~~¿Desde dónde se genera el PDF del punto 1?~~ → **Vista consolidada únicamente** (`PurchaseRequestConsolidatedModal.jsx`). Un consolidado de 1 sola solicitud tildada cubre el caso "individual" sin botón ni endpoint aparte.
2. ~~¿Cuántos PDFs se pueden adjuntar a una misma cotización?~~ → **Varios por cotización** (el proveedor puede mandar el PDF cotizado + fotos/evidencias aparte). El comparador visual (punto 3) muestra, por cada cotización comparada, la lista de sus adjuntos — no una sola imagen fija por columna.
3. ~~Nombre de la rama.~~ → `feature/purchase-quotation-pdf-documents`. Denis la crea él mismo (no se corre git por él, ver memoria `feedback_commit_messages`).

## Cómo hacerlo (borrador de plan, ajustar según lo que se responda arriba)

Todo reutiliza infraestructura que ya existe en el proyecto — no hay que instalar nada nuevo (`pdfkit` y `multer` ya están en `backend/package.json`).

### 1. Generar PDF de solicitud (backend)

Mismo patrón que `backend/src/modules/logs/infrastructure/reports/pdfLogReport.js` (`streamPdfReport(data, filters, res)`: crea `new PDFDocument(...)`, hace `doc.pipe(res)`, el controller pone los headers HTTP antes de llamar):

- Nuevo archivo, p.ej. `backend/src/modules/purchase-quotations/infrastructure/reports/pdfQuotationRequestReport.js` con `streamQuotationRequestPdf(lines, meta, res)`.
- Contenido del PDF: empresa (nombre/datos de `req.user.company` o similar), fecha, lista de productos + unidad + cantidad total solicitada (misma forma en que `PurchaseRequestConsolidatedModal.jsx` ya agrupa por `productId__unitId`), espacio para que el proveedor anote precio/condiciones a mano o referencia.
- Endpoint nuevo: `GET /api/purchase-requests/consolidated/pdf?ids=<id1,id2,...>` (acepta 1 o varios ids), reutilizando la misma agregación que ya hace `fetchLinesForRequests` en el frontend (mejor moverla a un use case backend si no existe ya, para no tener que mandar las líneas en query params).

### 2. Adjuntar PDF recibido a una cotización (backend)

Calco directo de `purchase-order-expense-documents` (confirmado como el patrón de referencia para adjuntos, ver `docs/PLAN-v0.9-recepcion-documentos-retaceo.md` sección 2):

- `shared/lib/upload.js`: agregar `uploadPurchaseQuotationDocument = buildSingleUploader('purchase-quotations', ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])` (se permite imagen también por si el proveedor manda foto en vez de PDF, igual criterio que gastos de orden).
- Nuevo módulo `purchase-quotation-documents` (domain/infrastructure/application calcados de `purchase-order-expense-documents`): `PurchaseQuotationDocument` (quotation FK, fileName, filePath, fileType), repository, `uploadPurchaseQuotationDocument.js` (valida que la quotation exista y sea de la company del usuario), `listPurchaseQuotationDocuments.js`, `deletePurchaseQuotationDocument.js` (borra archivo físico + registro, sin soft-delete, es un adjunto).
- Rutas: `POST /api/purchase-quotation-documents/quotation/:quotationId`, `GET /api/purchase-quotation-documents/quotation/:quotationId`, `DELETE /api/purchase-quotation-documents/:id`. Permisos nuevos `purchase_quotation_documents.upload/view/delete`. `logAction` con `resolveEntityName: (entity) => entity.fileName`, igual que en expense documents.
- Relación 1:N confirmada (varios documentos por cotización) — `GET` por quotation devuelve la lista completa, el frontend la muestra como lista de adjuntos, sin límite salvo el que imponga el tamaño de archivo del uploader.

### 3. Comparar hasta 3 PDFs lado a lado (frontend)

- `frontend/src/services/purchaseQuotationDocuments.api.js` — `getByQuotation(quotationId)`, `upload(quotationId, file)` (via `http.upload`, igual que `productImagesApi.upload`), `remove(id)`.
- En `PurchaseQuotationCreateModal.jsx` / `PurchaseQuotationDetailModal.jsx`: agregar input de archivo + lista de adjuntos (igual UI que donde se suben evidencias de gastos de orden, si ya hay un componente compartido reusarlo en vez de duplicar).
- Nuevo modal `PurchaseQuotationPdfComparisonModal.jsx` (SolidJS, calco de `PurchaseQuotationComparisonModal.jsx` en estructura): recibe hasta 3 `quotationIds`, por cada una pide su lista de documentos y los muestra en esa columna (cada adjunto con su propio `<embed src={fileUrl} type="application/pdf" />`/`<img>` según `fileType`, apilados o en mini-tabs si hay más de uno). Si una cotización no tiene ningún adjunto, mostrar placeholder "sin documentos adjuntos" en esa columna.
- Botón de acceso: junto al botón "Comparar" que ya existe en `PurchaseRequestConsolidatedModal.jsx`, agregar "Comparar PDFs" (deshabilitado si ninguna de las cotizaciones tiene adjunto).
- Botón "Generar PDF de solicitud" en `PurchaseRequestConsolidatedModal.jsx` (o donde indique la decisión #1), que llama al endpoint del punto 1 y dispara la descarga (`window.open` o blob + `<a download>`, revisar qué patrón ya usa el export de Bitácoras en el frontend para no reinventar).

### 4. Elegir la mejor cotización

Nada que construir — ya ocurre al crear la orden de compra desde la cotización ganadora (`purchase-orders`), que es lo que setea `status: 'selected'` en la `PurchaseQuotation` elegida.

## Notas

- Seguir el criterio de `feedback_verify_against_both_sources`: si al implementar aparece algo que no calza con lo que Denis tenía en mente, parar y preguntar en vez de asumir.
- Confirmar con Denis el nombre de los permisos nuevos y si van en el seed de roles ya existente.
- Branch la crea Denis, no Claude (ver memoria `feedback_commit_messages`).
