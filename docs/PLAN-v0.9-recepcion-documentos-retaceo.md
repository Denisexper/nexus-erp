# Plan de trabajo — ERS v0.9: Compras (Recepción), Documentos de gastos, y ajustes a Retaceo

> Plan de implementación acordado con Denis el 2026-09-14. Se guarda acá (en vez de solo en el plan efímero de Claude) para poder retomarlo en una sesión futura sin perder el contexto. Rama de trabajo: `feature/compras-recepcion-retaceo`.

## Contexto

La ERS v0.9 (`docs/MiniERP ERS v0.9-1.pdf`, cap. 6.8) formaliza el proceso de compras con tres piezas nuevas: **recepción real de mercancía** (`purchases`/`purchase_details`), **evidencias documentales de gastos** (`purchase_order_expense_documents`), y ajustes al **Retaceo**.

Al revisar el código contra el PDF y la captura de Eraser de Denis encontramos que:

1. **`purchases`/`purchase_details` no existe en el código.** El PDF dice explícitamente que "el Retaceo estará relacionado con la compra real y no directamente con la orden de compra" (6.8.26), pero hoy `retaceos` apunta directo a `purchase_orders` como parche — de hecho el propio comentario en `PurchaseOrder.js` ya reservaba los estados `partially_received`/`received`/`closed` para "módulo de Recepción/Compras" futuro. Esto coincide con lo anotado en la sesión de QA anterior ("kardex/retaceo unconnected in code").
2. **`purchase_order_expense_documents` es 100% nuevo** — evidencias (PDF/JPG/JPEG/PNG/WEBP) adjuntas a un gasto de orden.
3. El diagrama de Denis (Eraser) agrega dos campos que el PDF no menciona (confirmados por él): `purchase_order_expenses.isCostable` (boolean, si el gasto entra o no en el prorrateo del retaceo) y `retaceo_details.purchaseDetail` (FK, trazabilidad hasta la línea de recepción exacta).

Denis confirmó construir todo esto en una sola ronda: el módulo de recepción completo + re-enganchar Retaceo a `purchases` en vez de `purchase_orders`, más los documentos y los dos campos nuevos.

## Alcance

- **Nuevo módulo `purchases`** (recepción real, soporta recepción parcial contra una orden aprobada).
- **Nuevo módulo `purchase-order-expense-documents`** (upload de evidencias, reutilizando el patrón de `product-images`).
- **`purchase-orders`**: agregar `isCostable` a `purchase_order_expenses`.
- **`retaceos`**: re-engancharse a `purchases` en vez de `purchase_orders`, agregar `purchaseDetail` FK en el detalle, y filtrar gastos por `isCostable` al prorratear.
- Frontend correspondiente para las tres piezas.

## Backend

### 1. Módulo nuevo `purchases` (mismo layout que `purchase-orders`)

- `domain/Purchase.js` — estados `['draft', 'received', 'verified', 'cancelled', 'closed']` (6.8.25); campos: company, uuid, code (`C-00001`), purchaseOrder (FK), supplier, branch, warehouse, purchaseDate, supplierInvoiceNumber, supplierInvoiceDate, currency, subtotal, discount, tax, total, status, notes, user, details[].
- `domain/PurchaseDetail.js` — purchase (FK), purchaseOrderDetail (FK, trazabilidad a la línea de la orden — igual criterio que `purchase_quotation_request_details`), product, quantityOrdered, quantityReceived, unit, unitPrice, discount, subtotal, taxRate, taxAmount, total, notes.
- `domain/errors.js`, `domain/PurchaseRepository.js` (interfaz).
- `infrastructure/persistence/purchaseMongooseModel.js`, `purchaseDetailMongooseModel.js`, `MongoPurchaseRepository.js`.
- `application/use-cases/createPurchase.js` — **use case central**:
  - Valida que la orden exista, pertenezca a la company, y esté en un estado receivable (`approved`, `partially_received`).
  - Recibe cantidades recibidas por línea de orden; valida que `quantityReceived` acumulado (sumando compras previas contra esa misma `purchase_order_detail`) no exceda `quantityOrdered` (RN-008, CA-COM-018).
  - Calcula subtotal/tax/total de la compra a partir de las líneas realmente recibidas.
  - Al terminar, recalcula el estado de la orden: `partially_received` si queda pendiente algo, `received` si se completó todo (CA-COM-017).
  - Sin integración a Kardex todavía (6.8.46 dice explícito que la actualización de existencias es responsabilidad del módulo de Inventario, que no existe aún) — mismo criterio que Retaceo/Kardex ya desconectados hoy.
  - Sigue el patrón de escritura secuencial sin transacción de `createPurchaseOrder.js`/`createRetaceo.js`.
- `application/use-cases/listPurchases.js`, `getPurchaseById.js`, `cancelPurchase.js` (solo si `draft`, sin recepciones acumuladas que dependan de ella).
- `infrastructure/http/purchase.controller.js` + `purchase.routes.js` — permisos `purchases.view/create/cancel`, monta en `/api/purchases`. Reusa `requireOwnCompanyPurchase` + `logAction` igual que `purchase-orders`.

### 2. Módulo nuevo `purchase-order-expense-documents`

Calco directo de `product-images` (multer + disco local), pero para PDFs además de imágenes:

- `shared/lib/upload.js`: agregar un segundo export (junto a `uploadProductImage`) — nueva instancia multer con `ALLOWED_MIME_TYPES` = `['application/pdf', 'image/jpeg', 'image/png', 'image/webp']`, directorio `uploads/purchase-order-expenses`, mismo wrapper de `req.uploadError`.
- `domain/PurchaseOrderExpenseDocument.js`, `errors.js`, repository interfaz.
- `infrastructure/persistence/purchaseOrderExpenseDocumentMongooseModel.js` — purchaseOrderExpense (FK), fileName, filePath, fileType, uploadedAt.
- `application/use-cases/uploadPurchaseOrderExpenseDocument.js` (valida que el gasto exista y pertenezca a una orden de la company del usuario, igual chequeo que `uploadProductImage.js`), `listPurchaseOrderExpenseDocuments.js`, `deletePurchaseOrderExpenseDocument.js` (borra archivo físico + registro — el PDF no pide soft-delete acá porque no es una entidad de negocio con historial, es un adjunto).
- `infrastructure/http/purchaseOrderExpenseDocument.controller.js` + `.routes.js` — rutas `POST /expense/:expenseId`, `GET /expense/:expenseId`, `DELETE /:id`; permisos `purchase_order_expense_documents.upload/view/delete`; monta en `/api/purchase-order-expense-documents`.

### 3. `purchase-orders` — agregar `isCostable`

- `purchaseOrderExpenseMongooseModel.js`: agregar `isCostable: { type: Boolean, default: true }`.
- `addPurchaseOrderExpense.js`: aceptar y pasar `isCostable` (default `true` si no viene).
- `purchaseOrder.controller.js` (`addExpense`): leer `isCostable` del body.

### 4. `retaceos` — re-enganchar a `purchases`

- `retaceoMongooseModel.js`: reemplazar `purchaseOrder` (FK) por `purchase` (FK a `Purchase`). El índice único pasa de `{ company, purchaseOrder }` a `{ company, purchase }` — un retaceo por recepción, no por orden (una orden con varias recepciones parciales puede tener varios retaceos, uno por embarque, que es más realista).
- `retaceoDetailMongooseModel.js`: agregar `purchaseDetail` (FK a `PurchaseDetail`), junto al `product` que ya existe.
- `domain/Retaceo.js` / `RetaceoDetail.js`: renombrar prop `purchaseOrder` → `purchase`; agregar `purchaseDetail` en el detail.
- `domain/errors.js`: renombrar `PurchaseOrderNotFoundForRetaceoError` → `PurchaseNotFoundForRetaceoError`, `PurchaseOrderNotRetaceableError` → `PurchaseNotRetaceableError`, `PurchaseOrderAlreadyRetaceadoError` → `PurchaseAlreadyRetaceadoError` (más preciso ahora que el ancla real es la compra).
- `RetaceoRepository.findByPurchaseOrder` → `findByPurchase`; actualizar `MongoRetaceoRepository` (populate de `purchase` en vez de `purchaseOrder`, guardar `purchaseDetail` en cada línea).
- `createRetaceo.js`:
  - Recibe `purchase` en vez de `purchaseOrder`; busca vía `purchaseRepository`, exige `purchase.status === 'received'` (o `verified`, a definir con Denis en revisión final si aplica) en vez de `order.status === 'approved'`.
  - Las líneas (`lines`) salen de `purchase.details` (cantidad y costo realmente recibidos), no de `order.details`.
  - `totalFob` = suma de `purchase.details[].subtotal` (ya no `order.subtotal`).
  - `expenses` (gastos a distribuir) = suma de `purchase_order_expenses` de la orden de origen **filtrados por `isCostable === true`** — necesita un método nuevo en `purchaseOrderRepository` (p.ej. `getCostableExpensesTotal(purchaseOrderId)`) o resolverlo leyendo `order.expenses` ya cargado y filtrando en el use case (más simple, sin tocar el repository).
  - Cada `RetaceoDetail` ahora incluye `purchaseDetail: detail.id`.

## Frontend

- `services/purchases.api.js` — mismo shape que `purchaseOrders.api.js` (`getAll`, `getById`, `create`, `cancel`).
- `services/purchaseOrderExpenseDocuments.api.js` — `getByExpense(expenseId)`, `upload(expenseId, file)` (usa `http.upload`, igual que `productImagesApi.upload`), `remove(id)`.
- `features/purchases/` (calco de `features/purchase-orders/`): `Purchases.jsx` (lista, filtro por orden/estado), `PurchaseCreateModal.jsx` (selector de orden `approved`/`partially_received`, muestra pendiente por línea = `quantityOrdered - Σ quantityReceived previas`, inputs de cantidad recibida + datos de factura), `PurchaseDetailModal.jsx`, `statusMeta.js`.
- `App.jsx`: agregar ruta `/purchases` (lazy import, mismo patrón que las demás rutas de compras).
- `components/layout/Sidebar.jsx`: agregar link "Compras (Recepción)" en el mismo grupo condicional donde ya está `purchase_orders.view`.
- `features/purchase-orders/PurchaseOrderDetailModal.jsx`:
  - Checkbox "Aplica al retaceo" (`isCostable`, default marcado) en el form de "Registrar gasto".
  - Bajo cada gasto en "Gastos adicionales": lista de documentos adjuntos + botón para subir uno nuevo + borrar (usa `purchaseOrderExpenseDocuments.api.js`).
  - Botón "Registrar recepción" cuando `status` es `approved`/`partially_received`, que abre `PurchaseCreateModal` con la orden preseteada (mismo patrón que ya soporta `RetaceoCreateModal` con `presetPurchaseOrder`, aunque hoy nada lo dispara).
- `features/retaceos/RetaceoCreateModal.jsx`:
  - El selector pasa de "Orden de compra aprobada" (`purchaseOrdersApi.getAll({status:'approved'})`) a "Compra recibida" (`purchasesApi.getAll({status:'received'})`).
  - `buildPreview` y el payload usan `purchase`/`purchase.details` en vez de `order`/`order.details`.
- `features/retaceos/RetaceoDetailModal.jsx` y `Retaceos.jsx`: donde hoy muestran `retaceo.purchaseOrder?.code`, cambiar a `retaceo.purchase?.code` (y si quieren mostrar la orden de origen también, vía `retaceo.purchase.purchaseOrder`).

## Datos existentes

Los retaceos ya creados en la BD de desarrollo/QA apuntan a `purchaseOrder`, campo que desaparece del schema. Como es data de prueba (no hay operación real en producción todavía), lo más simple es que Denis borre esos retaceos de prueba antes de levantar el server con el nuevo schema — mismo criterio que cuando limpió las 32 ubicaciones de prueba. Confirmar con él antes de aplicar el cambio de schema.

## Verificación

1. Levantar el backend y crear manualmente vía UI/Postman el flujo completo: Solicitud → Cotización → Orden (aprobar) → **Recepción (compra)** parcial y luego completa → Retaceo sobre la compra → confirmar que el costo unitario calculado coincide con el ejemplo del PDF (6.8.44, Prensadora = $63,940.48).
2. Subir un documento (PDF y una imagen) a un gasto de la orden, listarlo, borrarlo.
3. Marcar un gasto con `isCostable = false` y confirmar que el retaceo generado no lo incluye en `total_expenses`.
4. Verificar que los permisos nuevos (`purchases.*`, `purchase_order_expense_documents.*`) aparecen auto-descubiertos en el catálogo de permisos y que el rol admin los recibe automáticamente (mismo mecanismo que ya usan los demás módulos, sin seed manual).
5. Revisar en el navegador el flujo de UI de principio a fin, igual que las QAs manuales anteriores.

## Progreso

- [x] Backend: módulo `purchases` (domain, persistence, use-cases, http) — falta registrar rutas en `server.js`
- [x] Backend: módulo `purchase-order-expense-documents` (domain, persistence, use-cases, http) — falta registrar rutas en `server.js`
- [x] Backend: `shared/lib/upload.js` refactorizado (factory) + export `uploadPurchaseOrderExpenseDocument`
- [x] Backend: `PurchaseOrderRepository.findExpenseById` (nuevo método, usado por el módulo de documentos para validar tenencia)
- [x] Backend: `purchaseRoutes` y `purchaseOrderExpenseDocumentRoutes` registradas en `backend/src/server.js`
- [ ] **Siguiente paso**: Backend: `isCostable` en `purchase-orders` (campo nuevo en `purchaseOrderExpenseMongooseModel.js` + `addPurchaseOrderExpense.js` + controller)
- [ ] Backend: rewire `retaceos` → `purchases` (⚠️ cambio incompatible con los retaceos de prueba existentes — coordinar con Denis antes de aplicar, ver sección "Datos existentes")
- [ ] Frontend: `purchases` (lista + modales)
- [ ] Frontend: documentos de gasto en `PurchaseOrderDetailModal`
- [ ] Frontend: `isCostable` checkbox
- [ ] Frontend: `RetaceoCreateModal`/`RetaceoDetailModal` apuntando a `purchase`
- [ ] Verificación end-to-end

**Nota de la sesión 2026-09-14**: se detuvo el trabajo acá a propósito, en un punto donde nada de lo existente se rompió (los módulos nuevos todavía no están registrados en `server.js`, y los únicos cambios a código existente — `upload.js` y `PurchaseOrderRepository` — son aditivos), para permitir un commit intermedio antes de seguir con el resto.
