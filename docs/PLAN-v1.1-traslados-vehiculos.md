# Manifiesto de Traslados — Plan de cierre ERS v1.1 (cap. 6.9)

> Anotado el 2026-11-24 a partir de la comparación línea por línea entre `docs/MiniERP ERS v1.0.pdf` y `docs/MiniERP ERS v1.1.pdf`. Versión interactiva (con tablas y diagramas) publicada como artifact: [Manifiesto de Traslados](https://claude.ai/artifact/AgDCoizkHTf4ZXYDpwR45p). Este archivo es la versión de texto plano, para quedar versionada en el repo.

## Resumen ejecutivo

El cambio entre v1.0 y v1.1 está **contenido por completo en el capítulo 6.9** (Inventario). Ningún otro capítulo del ERS se tocó y no aparecen capítulos nuevos — Ventas, Devoluciones, Flota, Reportes siguen sin redactarse. Esto es, literalmente, la última pieza pendiente del documento.

Qué formaliza v1.1:

1. **Ubicaciones unificadas** (`inventory_locations`): antes el vehículo en tránsito era un `Location` más con `type: 'vehicle'` dentro del almacén. Ahora el ERS exige una tabla que envuelve dos orígenes posibles — un `location` físico o un `vehicle_location` real — cada uno asociado a un vehículo concreto, no a un almacén.
2. **Vehículos y conductores como entidades reales** (`vehicles`, `employees`): no existen en el proyecto todavía. El ERS pide placa, marca, modelo, año y empleado responsable por vehículo; DUI, cargo y sucursal por empleado.
3. **Traslados con máquina de estados ampliada y recepción parcial**: pasa de 5 estados propios (`preparing/in_transit/received/incident/resolved`) a los 7 del ERS (`DRAFT, AUTHORIZED, IN_TRANSIT, PARTIALLY_RECEIVED, RECEIVED, WITH_DISCREPANCY, CANCELLED`), con cantidad **solicitada** además de despachada y recibida.
4. **El movimiento de dos tramos vuelve a ser obligatorio**: RN-INV-008 exige 4 movimientos de Kardex por traslado completo (origen OUT + vehículo IN al despachar; vehículo OUT + destino IN al recibir).

## ⚠️ Conflicto crítico — revisar antes de tocar código

La rama `refactor/inventory-transfer-single-movement` (commit `d532add`, 2026-11-21) eliminó a propósito el doble movimiento vía ubicación-vehículo para que el stock se mueva "una sola vez, al recibir". **El ERS v1.1 pide exactamente lo contrario**, de forma explícita en RN-INV-008, RN-INV-009 y RN-INV-015:

> «Todo traslado registrará al despachar origen OUT y vehículo IN; al recibir, vehículo OUT y destino IN, por lote y cantidad confirmada. Las recepciones parciales conservarán el saldo pendiente en el vehículo.» — RN-INV-008

| | Hoy en el código | Lo que pide v1.1 |
|---|---|---|
| Despachar | (sin movimiento) | origen OUT, vehículo IN |
| Recibir | origen OUT, destino IN | vehículo OUT, destino IN |
| Parcial | — | saldo queda en vehículo |
| **Total movimientos / traslado completo** | **1** | **4** |

**Recomendación:** no revertir el commit con git — construir las fases 2/3 (abajo) directamente sobre `inventory_locations`, que reemplaza por completo la idea de `vehicleLocation` suelto. El commit de noviembre queda en el historial, pero el comportamiento cambia.

## Modelo de datos — entidades nuevas y existentes que cambian

| Entidad | Situación | Detalle |
|---|---|---|
| `employees` | **nuevo** | No existe ningún módulo de empleados/conductores hoy. Datos mínimos del ERS: nombres, apellidos, correo, teléfono, DUI, cargo, sucursal, estado. |
| `vehicles` | **nuevo** | Marca, modelo, año, placa, empleado responsable, estado. Un vehículo no puede estar en dos traslados activos superpuestos. |
| `vehicle_locations` | **nuevo** | Una fila por vehículo; `id_warehouse` es su base operativa, no el origen/destino del traslado en curso. |
| `inventory_locations` | **nuevo** | Envuelve `locations` (almacén) o `vehicle_locations` (vehículo) — exactamente una de las dos. Todo el resto del módulo de inventario pasa a referenciar esta tabla en vez de `locations` directamente. |
| `inventory_location_details` | cambia FK | `id_location` → `id_inventory_location`. Ya existe; solo cambia a qué apunta. |
| `inventory_movements` | cambia semántica | Mismo propósito, pero ahora un traslado completo escribe 4 filas en vez de 1. FK también migra a `id_inventory_location`. |
| `inventory_transfers` | +campos, +estados | Suma `id_vehicle`, `id_driver_employee`. Estados pasan de 5 a 7. |
| `inventory_transfer_details` | +cantidad | Suma `quantity_requested`; `quantity_dispatched` y `quantity_received` ya existen. Ubicaciones origen/destino pasan a `inventory_locations`. |
| `inventory_lots`, `inventory_cost_averages`, `inventory_label_prints` | sin cambios | El ERS no modifica estas tablas. |

## Máquina de estados del traslado

```
DRAFT → AUTHORIZED → IN_TRANSIT → PARTIALLY_RECEIVED → RECEIVED
                                        ramas: WITH_DISCREPANCY (= incident actual), CANCELLED
```

`AUTHORIZED`, `PARTIALLY_RECEIVED` y `CANCELLED` son nuevos. `WITH_DISCREPANCY` es el `incident` actual renombrado/realineado al ERS.

## Permisos RBAC — claves pendientes

| Permiso | Estado | Para qué |
|---|---|---|
| `inventory.transfer.authorize` | nuevo | Paso DRAFT → AUTHORIZED, antes de asignar vehículo/conductor. |
| `inventory.transfer.dispatch` | nuevo | Confirmar despacho (hoy cubierto por el genérico `inventory.transfer`). |
| `inventory.transfer.receive` | nuevo | Confirmar recepción, total o parcial. |
| `inventory.transfer.discrepancy` | nuevo | Investigar y resolver faltantes/sobrantes/daños. |
| `inventory.transit.view` | nuevo | Consultar mercancía en tránsito por vehículo/lote. |
| `inventory.view` | nuevo | Lectura general de existencias (hoy implícito, sin clave propia). |
| `inventory.receive` | nuevo | Confirmar ingreso de compra — ya implementado funcionalmente, falta la clave formal. |
| `inventory.cost.view` | nuevo | Consultar valoración/costo promedio como permiso separado de `inventory.lots.view`. |
| `employees.manage` / `vehicles.manage` | nuevo | No están en el ERS con ese nombre literal, pero hacen falta para los CRUD de flota — mismo patrón que `branches.manage`. |
| `inventory.transfer`, `inventory.kardex.view`, `inventory.adjust`, `inventory.label.print`, `inventory.lots.view`, `inventory.location.assign` | ya existen | Se mantienen; `inventory.transfer` queda como el permiso "paraguas" para listar/crear. |

## Plan de trabajo — fases propuestas

Mismo patrón que el resto del proyecto: una rama/PR por fase, QA funcional por script antes de pasar a la siguiente. Orden por dependencia real — no se puede construir traslados nuevos sin vehículos, ni vehículos sin ubicaciones unificadas.

**Fase 0 — Decisión: revertir el movimiento único** (bloqueante, sin código)
Confirmar que se construye el modelo de dos tramos directamente sobre `inventory_locations`, sin revertir el commit del 21-nov con git.

**Fase 1 — Flota: `employees` y `vehicles`**
Dos módulos nuevos, CRUD simple, Clean Architecture igual que `branches`/`warehouses`. `employees` referencia `branches`; `vehicles` referencia `employees` (responsable).
Archivos: `backend/src/modules/employees/`, `backend/src/modules/vehicles/`, `frontend/src/features/employees/`, `frontend/src/features/vehicles/`.

**Fase 2 — Ubicaciones unificadas** (mayor riesgo)
Crea `vehicle_locations` e `inventory_locations`, migra `inventory_location_details` + `inventory_movements` para apuntar a `id_inventory_location`. Toca el módulo núcleo construido con transacciones Mongo (sesión 1-nov) — revisar con cuidado las consultas que hoy asumen un `Location` plano.
Archivos: `backend/src/modules/locations/`, `backend/src/modules/inventory/domain/`, `backend/src/modules/inventory/infrastructure/persistence/`.

**Fase 3 — Traslados: máquina de estados + 2 tramos**
Reconstruye `inventory-transfers` sobre `inventory_locations`: asignar vehículo/conductor, estado `AUTHORIZED` explícito antes de despachar, `quantity_requested` en el detalle, despacho y recepción escriben los movimientos compensados, recepción parcial deja saldo real en el vehículo (`PARTIALLY_RECEIVED`), `CANCELLED` solo antes del despacho.
Archivos: `backend/src/modules/inventory-transfers/domain/`, `application/use-cases/*`, `dispatchTransfer.js`, `receiveTransfer.js`.

**Fase 4 — Permisos y roles**
Las 8 claves nuevas de la tabla de arriba, más `employees.manage`/`vehicles.manage`. Asignar a los roles existentes — "Encargado de Logística" ya aparece como actor en el ERS (sección 4.6) y probablemente nace como rol real en este punto.

**Fase 5 — Kardex y consultas en tránsito**
Extender `GET /inventory/movements` para filtrar por vehículo y mostrar mercancía en tránsito por separado del saldo de destino. Chequeo de consistencia: suma de saldos por ubicación debe conciliar con la cantidad global de `inventory_cost_averages` (RN-INV-018).

**Fase 6 — Frontend**
CRUD de Empleados y Vehículos; rediseño del flujo de Traslados en pasos (crear → autorizar → despachar → recibir/discrepancia); vista de mercancía en tránsito.

**Fase 7 — QA**
Script funcional por fase contra datos reales (mismo patrón que las 5 fases de noviembre), y al final QA manual en navegador — la que sigue pendiente también de la fase de transferencias anterior.

## Decisiones de Denis — antes de empezar a programar

1. **¿Se revierte el refactor del 21-nov o se re-implementa desde cero sobre el nuevo modelo?**
   Recomendado: no revertir con git — construir la Fase 2/3 directamente sobre `inventory_locations`.
2. **¿"Encargado de Logística" se vuelve un rol real del sistema (RBAC) en esta fase?**
   El ERS lo define como actor desde la sección 4.6 pero nunca se construyó como rol. Con vehículos/empleados entrando, es el momento natural de darlo de alta si se quiere reflejo 1:1 con el documento.
3. **¿`employees` es un catálogo propio o se fusiona con `users`?**
   El ERS los trata como entidades separadas (RN-002: "cada usuario deberá estar asociado a un empleado"). Para este alcance — solo necesitamos conductores — alcanza con `employees` mínimo, sin forzar el vínculo 1:1 con `users` todavía.

## Criterios de aceptación del ERS (trazabilidad)

- [ ] Un lote puede estar distribuido en varias ubicaciones sin perder trazabilidad — *ya cumple*
- [ ] El traslado registra 4 movimientos al despachar y recibir completamente — *fase 2–3*
- [ ] Cada vehículo dispone de una ubicación de inventario única y consultable — *fase 1–2*
- [ ] Las cantidades en tránsito son visibles por vehículo, lote y traslado, sin considerarse disponibles en destino — *fase 5*
- [ ] Una recepción parcial conserva las unidades pendientes en el vehículo y permite una recepción posterior — *fase 3*
- [x] El costo promedio se calcula por empresa y producto, sin duplicar valor por traslados — *ya cumple*
- [x] Una venta entregada reduce únicamente las existencias de la ubicación de la sucursal que despacha — *ya cumple*
- [ ] Se registran usuarios, fechas, autorizaciones, despacho, recepción y discrepancias en la bitácora — *fase 3–4*
