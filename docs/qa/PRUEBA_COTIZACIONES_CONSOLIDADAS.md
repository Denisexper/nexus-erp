# Guía de pruebas — Consolidación de Solicitudes de Compra y Comparación de Cotizaciones

Cubre las 2 features más recientes del módulo de Compras, mergeadas a
`main` vía PR #74 y PR #75:

- **Vista consolidada de solicitudes**: antes solo se podía revisar una
  Solicitud de compra a la vez; ahora se pueden seleccionar varias y verlas
  agrupadas por producto antes de decidir cómo cotizar.
- **Comparación de cotizaciones entre solicitudes consolidadas**: la
  comparación de cotizaciones (ya existente para una sola solicitud) se
  generalizó para poder comparar cotizaciones que cubren varias solicitudes
  a la vez.

No forma parte del ERS (el ERS solo define el flujo de Compras hasta
Recepción, cap. 6.8/6.9) — es una mejora de producto pedida después de ver
el flujo en uso real.

Marca cada casilla (`- [ ]` → `- [x]`) mientras avanzas. Al final hay una
tabla para anotar bugs o dudas.

## 0. Requisitos previos

- Tener sesión en una empresa con usuario que tenga los permisos:
  `purchase_requests.view`, `purchase_requests.create`, `purchase_requests.submit`,
  `purchase_quotations.view`, `purchase_quotations.create` (el rol `admin`
  ya los tiene todos).
- Al menos **2 productos activos** y **2 proveedores activos** en la empresa.
- Al menos una Sucursal y un Almacén activos con stock/configuración normal
  (no hace falta Kardex ni Retaceo para esta prueba).
- No hace falta una segunda empresa ni nada de multi-tenancy — esta prueba
  es dentro de una sola empresa.

## 1. Crear dos Solicitudes de compra con un producto en común

Menú: **Compras → Solicitudes de compra** (`/purchase-requests`).

- [ ] Crear **Solicitud 1**: botón "+ Nueva solicitud", elegir Sucursal y
  Almacén, guardar (queda en `Borrador`).
- [ ] Abrir su detalle (ícono 👁️) y agregar 2 líneas de producto, por
  ejemplo: `Producto A` cantidad `5`, `Producto B` cantidad `3`.
- [ ] Desde el detalle, click "Enviar solicitud" → pasa a `Enviada`.
- [ ] Crear **Solicitud 2** (puede ser misma Sucursal/Almacén u otra).
- [ ] Agregarle 2 líneas, una de ellas con **el mismo `Producto A`** en
  distinta cantidad (ej. `2`) y otra con un producto distinto, `Producto C`
  cantidad `4`.
- [ ] Enviarla también → pasa a `Enviada`.

**Resultado esperado:** ambas solicitudes quedan en estado `Enviada` y
aparecen en la lista con casilla de selección a la izquierda (solo las
solicitudes en `Enviada` o `Parcialmente cotizada` muestran esa casilla).

## 2. Vista consolidada

En la lista de Solicitudes de compra:

- [ ] Marcar la casilla de **Solicitud 1** — debe aparecer una barra
  "1 solicitud seleccionada" con el botón "Ver consolidado" **deshabilitado**
  (hace falta mínimo 2).
- [ ] Marcar también **Solicitud 2** — el botón se habilita y dice
  "Ver consolidado (2)".
- [ ] Click en "Ver consolidado (2)".

**Resultado esperado en el modal:**
- [ ] Aparecen los 2 códigos de solicitud como etiquetas arriba.
- [ ] La tabla muestra **3 filas** (no 4): `Producto A`, `Producto B`,
  `Producto C` — es decir, agrupó `Producto A` de ambas solicitudes en una
  sola fila.
- [ ] La fila de `Producto A` muestra **cantidad total = 7** (5 + 2) y en
  "Solicitudes de origen" aparecen las 2 etiquetas: `<código Solicitud 1> · 5`
  y `<código Solicitud 2> · 2`.
- [ ] Las filas de `Producto B` y `Producto C` muestran cantidad y origen
  correctos, cada una con una sola etiqueta.

- [ ] Click en "Comparar cotizaciones" (todavía no existe ninguna) → debe
  abrir el modal de comparación y mostrar el mensaje *"Todavía no hay
  cotizaciones registradas para esta solicitud"* (sin romper nada aunque
  sean 2 solicitudes). Cerrar ese modal.

## 3. Crear la primera cotización desde el consolidado

Seguir desde el mismo modal de consolidado:

- [ ] Click en "Crear cotización con estas solicitudes".
- [ ] Verificar que se abre el formulario de cotización **sin** el selector
  de "una solicitud a la vez" — en su lugar dice "Productos de las 2
  solicitudes seleccionadas", agrupadas por código de solicitud, todas
  las líneas ya vienen con el checkbox **marcado**.
- [ ] Click en "+ Agregar seleccionadas".
- [ ] Verificar que en "Productos cotizados" también aparecen **3 líneas**
  (no 4) y que `Producto A` muestra 2 etiquetas de origen (una por cada
  solicitud) con cantidad total 7.
- [ ] Elegir **Proveedor X**, completar Precio unitario para las 3 líneas
  (cualquier valor), dejar vigencia/condiciones a elección.
- [ ] Guardar ("Registrar cotización").

**Resultado esperado:**
- [ ] Mensaje de éxito, modal se cierra, selección de la lista se limpia.
- [ ] Ambas solicitudes cambian de estado en la lista — revisar cuál estado
  les queda (`Parcialmente cotizada` si no se cubrió el 100% de alguna
  línea, `Cotizada` si sí). Anotar el resultado real en la tabla de hallazgos.

## 4. Crear una segunda cotización para poder comparar

Hace falta una segunda cotización que cubra (al menos parcialmente) las
mismas solicitudes, de un proveedor distinto, para que la comparación
tenga algo que mostrar lado a lado.

- [ ] Volver a la lista de Solicitudes de compra. Si alguna quedó en
  `Parcialmente cotizada` debería seguir teniendo casilla de selección;
  si ambas quedaron en `Cotizada` completa, usá **Solicitud 2** sola (o
  repetí el paso 1 con una Solicitud 3 nueva) para tener algo
  seleccionable — anotá cuál camino tomaste.
- [ ] Repetir el flujo: seleccionar, "Ver consolidado", "Crear cotización
  con estas solicitudes".
- [ ] Esta vez elegir **Proveedor Y** (distinto al anterior) y precios
  unitarios **distintos** a los de la primera cotización (para que se note
  la diferencia al comparar).
- [ ] Guardar.

## 5. Comparar cotizaciones (con datos)

- [ ] Volver a seleccionar las mismas solicitudes usadas en los pasos 3 y 4
  (si ya no tienen casilla porque quedaron `Cotizada`/`Parcialmente
  ordenada`, abrir cualquiera de ellas por detalle y usar el botón
  "Ver cotizaciones" ahí en vez del consolidado — ver sección 6).
- [ ] "Ver consolidado" → "Comparar cotizaciones".

**Resultado esperado:**
- [ ] Aparecen **2 tarjetas lado a lado**, una por proveedor (Proveedor X y
  Proveedor Y), cada una con su código de cotización y estado.
- [ ] Cada tarjeta lista sus líneas de producto con precio unitario.
- [ ] Cada tarjeta muestra días de entrega, condiciones de pago, vigencia y
  **Total** al pie.
- [ ] El sistema **no** marca ninguna tarjeta como "mejor opción" ni resalta
  la más barata — es a propósito (decisión de compra queda en la persona,
  no automatizada). Confirmar que efectivamente no hay ningún indicador de
  "recomendada" o similar.

## 6. Confirmar que la comparación de una sola solicitud sigue funcionando

Esta función ya existía antes de la consolidación — hay que confirmar que
generalizarla no la rompió.

- [ ] Abrir el detalle (👁️) de **una sola** de las solicitudes usadas
  arriba (que ya tenga alguna cotización).
- [ ] Debe aparecer el botón "Ver cotizaciones" en Acciones (solo visible
  si el estado es `Parcialmente cotizada`, `Cotizada`, `Parcialmente
  ordenada` o `Completada`).
- [ ] Click → debe abrir el mismo modal de comparación, pero mostrando
  **solo** las cotizaciones que incluyen líneas de esta solicitud puntual
  (no las de la otra solicitud que no comparte producto, si aplica).

## 7. Casos borde

- [ ] En la lista de Solicitudes, confirmar que una solicitud en
  `Borrador`, `Rechazada`, `Cancelada`, `Cotizada` o `Completada` **no**
  muestra casilla de selección (solo `Enviada` y `Parcialmente cotizada`).
- [ ] Con 2 solicitudes seleccionadas, click en "Limpiar selección" → la
  barra desaparece y las casillas se desmarcan.
- [ ] Cambiar de página de la tabla (si hay suficientes solicitudes para
  paginar) con 1+ seleccionadas de la página anterior → confirmar que la
  selección **no se pierde** al volver a esa página (el contador de la
  barra debe seguir reflejando lo ya marcado).
- [ ] En el formulario de cotización desde consolidado, destildar una de
  las líneas antes de "Agregar seleccionadas" → confirmar que esa línea
  queda fuera de "Productos cotizados".

## Hallazgos encontrados

| # | Paso | Descripción | Severidad (bug/duda de UX/esperado) |
|---|------|-------------|--------------------------------------|
|   |      |             |                                      |
|   |      |             |                                      |

---
*Generado para validar PR #74 (`feature/purchase-request-consolidation`) y
PR #75 (`feature/purchase-quotation-comparison-consolidated`), ya mergeados
a `main`.*
