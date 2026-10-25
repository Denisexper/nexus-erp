# Guía de pruebas — PDF de Solicitud de Cotización y Documentos Adjuntos de Cotización

Cubre la feature más reciente del módulo de Compras, mergeada a `developer`
vía PR #82 (backend) y pendiente de un segundo PR (frontend):

- **Generar PDF de solicitud (RFQ)**: desde la vista consolidada de
  Solicitudes de compra, genera y descarga un PDF con los productos
  agrupados, para mandárselo a mano al proveedor. El sistema **no** envía
  nada automático (ni email ni nada).
- **Documentos adjuntos de cotización**: en el detalle de una Cotización, se
  puede subir (y borrar) el PDF o foto que el proveedor devolvió cotizado,
  como respaldo documental. Se permiten **varios adjuntos por cotización**.
- **Comparar PDFs**: desde el comparador numérico de cotizaciones, un botón
  nuevo abre una vista lado a lado (hasta 3 cotizaciones) con todos los
  adjuntos de cada una.

No forma parte del ERS (se verificó contra `docs/MiniERP ERS v0.8-1.pdf` y
`v0.9-1.pdf`, cap. 6.8) — es un plus-feature pedido por Denis, documentado en
`docs/features/README.md`.

Marca cada casilla (`- [ ]` → `- [x]`) mientras avanzas. Al final hay una
tabla para anotar bugs o dudas.

## 0. Requisitos previos

- Usuario con los permisos: `purchase_requests.view`, `purchase_requests.export`,
  `purchase_quotations.view`, `purchase_quotations.create`,
  `purchase_quotation_documents.view`, `purchase_quotation_documents.upload`,
  `purchase_quotation_documents.delete` (el rol `admin` ya los tiene todos —
  son permisos nuevos, descubiertos solos al levantar el backend).
- Al menos **2 Solicitudes de compra enviadas** (`Enviada` o `Parcialmente
  cotizada`) con productos, para la parte de PDF de solicitud. Se puede
  reusar el mismo flujo de `PRUEBA_COTIZACIONES_CONSOLIDADAS.md` pasos 1-2.
- Al menos **2 Cotizaciones ya registradas** (de proveedores distintos) para
  la parte de comparación visual — también reusable de esa misma guía,
  pasos 3-4.
- Tener a mano un PDF cualquiera y una imagen cualquiera (JPG/PNG) en el
  equipo, para probar la subida de adjuntos.

## 1. Generar PDF de solicitud desde el consolidado

Menú: **Compras → Solicitudes de compra** (`/purchase-requests`).

- [ ] Tildar **una sola** solicitud enviada → "Ver consolidado" (si el botón
  pide mínimo 2, usar el consolidado de una sola solicitud desde donde se
  pueda, o saltar a tildar 2 y repetir este paso luego con solo una).
- [ ] En el modal de consolidado, click en **"Generar PDF de solicitud"**.

**Resultado esperado:**
- [ ] El navegador descarga un archivo `solicitud_cotizacion_<fecha>.pdf`
  (no se abre ningún correo ni se manda nada, solo se descarga).
- [ ] Al abrir el PDF: título "Solicitud de cotización", nombre de la
  empresa, el código de la solicitud tildada, fecha de generación.
- [ ] La tabla del PDF lista los productos de esa solicitud con su unidad y
  cantidad solicitada, y una columna/espacio en blanco para que el
  proveedor anote precio y condiciones a mano.
- [ ] Mensaje de éxito ("PDF de solicitud generado") en la pantalla.

- [ ] Cerrar el modal, tildar **2 o más** solicitudes enviadas → "Ver
  consolidado" → "Generar PDF de solicitud" de nuevo.

**Resultado esperado:**
- [ ] El PDF trae **todos los códigos** de las solicitudes tildadas en el
  encabezado ("Solicitudes de origen: SCR-..., SCR-...").
- [ ] Los productos vienen **agrupados** igual que en la tabla del
  consolidado en pantalla (si ambas solicitudes pedían el mismo producto,
  en el PDF aparece una sola fila con la cantidad sumada, no dos filas).

## 2. Documentos adjuntos en el detalle de una cotización

Menú: **Compras → Cotizaciones** (`/purchase-quotations`).

- [ ] Abrir el detalle (👁️) de una cotización ya registrada.
- [ ] Bajar hasta la sección **"Documentos adjuntos"** — debe aparecer
  debajo de "Productos cotizados", con el texto aclaratorio de que es solo
  respaldo y que los precios siguen siendo los tipeados a mano.
- [ ] Si todavía no tiene nada, debe decir **"Sin documentos adjuntos."**
- [ ] Click en **"+ Adjuntar documento"**, elegir el PDF de prueba.

**Resultado esperado:**
- [ ] Mensaje de éxito ("Documento cargado correctamente").
- [ ] Aparece una etiqueta `📎 <nombre del archivo>` clickeable.
- [ ] Click en la etiqueta → abre el PDF en una pestaña nueva, es el mismo
  archivo que se subió.

- [ ] Click en "+ Adjuntar documento" otra vez, ahora elegir la **imagen**
  de prueba (JPG o PNG).

**Resultado esperado:**
- [ ] Se suma una **segunda** etiqueta junto a la primera (no reemplaza la
  del PDF) — confirma que el módulo permite varios adjuntos por cotización.
- [ ] Click en la etiqueta de la imagen → abre la imagen en pestaña nueva.

- [ ] Intentar subir un archivo de otro tipo (ej. `.docx`, `.xlsx`, `.txt`).

**Resultado esperado:**
- [ ] El sistema lo rechaza con un mensaje de error (extensión no
  permitida) — solo se aceptan PDF, JPG, PNG y WEBP.

- [ ] Click en la ✕ de uno de los dos adjuntos subidos.

**Resultado esperado:**
- [ ] Pide confirmación ("¿Eliminar este documento?").
- [ ] Al confirmar, mensaje de éxito y la etiqueta desaparece de la lista.
- [ ] Refrescar la página / reabrir el detalle → el adjunto sigue sin
  aparecer (se borró de verdad, no solo visualmente).

## 3. Comparar PDFs entre cotizaciones

Requiere 2 (o más) cotizaciones ya registradas para las mismas solicitudes
(ver requisitos previos) y que al menos una tenga un adjunto subido (paso 2).

- [ ] Desde **Solicitudes de compra**, tildar las solicitudes cubiertas por
  esas cotizaciones → "Ver consolidado" → "Comparar cotizaciones".
- [ ] En el modal de comparación numérica (tarjetas con precios), click en
  el botón nuevo **"Comparar PDFs"**.

**Resultado esperado:**
- [ ] Se abre un modal nuevo, encima del anterior, con una **columna por
  cotización** (proveedor y código arriba de cada una).
- [ ] La columna de la cotización que tiene adjuntos (paso 2) muestra el PDF
  **embebido** (se ve el contenido sin tener que descargarlo) y, si subiste
  también la imagen, se ve debajo o junto al PDF.
- [ ] La columna de la cotización que **no** tiene adjuntos muestra el
  texto **"Sin documentos adjuntos."**, sin romper el layout.
- [ ] Cerrar ese modal (botón "Cerrar") → vuelve a ver el comparador
  numérico de atrás, no cierra todo de un golpe.

## 4. Casos borde y permisos

- [ ] Con un usuario **sin** el permiso `purchase_requests.export`: abrir el
  consolidado → el botón "Generar PDF de solicitud" no debe aparecer (los
  otros dos botones sí).
- [ ] Con un usuario **sin** `purchase_quotation_documents.upload`: abrir el
  detalle de una cotización → la sección de adjuntos debe mostrar los que
  ya existan, pero **sin** el botón "+ Adjuntar documento".
- [ ] Con un usuario **sin** `purchase_quotation_documents.delete`: los
  adjuntos deben listarse sin la ✕ de borrar.
- [ ] Si hay **más de 3 cotizaciones** en la comparación numérica, click en
  "Comparar PDFs" → debe mostrar solo las primeras 3 (no debe romperse ni
  mostrar un grid con 4+ columnas apretadas).
- [ ] Pedir el PDF de solicitud (paso 1) con una solicitud que **no**
  pertenece a tu empresa (si tenés acceso a probar multi-tenancy, ej. con
  el id de una solicitud de otra company) → debe fallar con un error claro
  ("no existen o no pertenecen a esta empresa"), nunca traer datos de otra
  empresa.

## Hallazgos encontrados

| # | Paso | Descripción | Severidad (bug/duda de UX/esperado) |
|---|------|-------------|--------------------------------------|
| | | | |

---
*Generado para validar el backend ya mergeado a `developer` (PR #82) y el
frontend de la misma feature (`feature/purchase-quotation-pdf-documents`),
pendiente de su propio PR hacia `developer`.*
