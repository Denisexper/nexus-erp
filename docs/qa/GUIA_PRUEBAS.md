# Guía de Pruebas — Nexus ERP (cobertura hasta ERS v0.8, cap. 6.8 + multi-tenancy + módulos extra)

Reemplaza a la versión anterior (`docs/GUIA_PRUEBAS.md`, 2026-08-11), que solo
cubría hasta el capítulo 6.6 (Proveedores) y no conocía multi-tenancy,
Compras, Retaceo, Kardex ni imágenes de producto.

Esta guía recorre el sistema **en el orden real de dependencias**: cada
módulo se apoya en datos creados en el anterior, así que probarlos fuera de
orden va a dar falsos positivos o falsos negativos.

Marca cada casilla a mano (`- [ ]` → `- [x]`) mientras avanzas, o cópiala a un
issue/checklist si tu equipo prefiere llevar el registro ahí.

## 0. Cómo se supone que fluye el sistema

```
Empresa (companies)                    — tenant raíz, tiene su propio slug
 └─ Sucursal (branches)
     └─ Almacén (warehouses)           — tiene una categoría (warehouse_category)
         └─ Ubicación (locations)      — pasillo/estante/nivel/posición

Catálogos scoped por empresa (multi-tenancy Fase 4):
 categories → sub-categories, units, suppliers → supplier_contacts

Producto — punto donde convergen los catálogos:
 products: category/subCategory + unit + purchaseUnit + saleUnit + supplier

Compras (ERS v0.8, cap. 6.8) — flujo secuencial:
 expense-types → purchase-requests → purchase-quotations → purchase-orders (approved)

Retaceo (fuera de ERS, plus-feature) — se calcula UNA VEZ sobre una orden approved:
 reparte flete + DAI + gastos entre los productos de esa orden

Kardex (fuera de ERS, plus-feature) — historial CONTINUO de movimientos:
 independiente de Retaceo hoy; no hay código que conecte ambos módulos
```

Todo sigue siendo **RBAC-first** (`authMiddleware` + `checkPermission`) y
**auditado** (`logs`/Bitácora en cada creación/edición/activación).

Lo que el ERS deja fuera de alcance por ahora: Recepción de mercancía, Costo
real, Asignación de precios, Ventas, Devoluciones, Traslados,
Vehículos/Conductores, Reportes.

## 1. Preparar el entorno

```bash
cd backend
pnpm install
pnpm dev            # nodemon, puerto 4000

cd frontend
pnpm install
pnpm dev            # vite, puerto 3001
```

Al arrancar el backend corre el auto-discovery de permisos (el rol `admin`
siempre recibe todos los permisos descubiertos) y el seed de
países/departamentos/municipios/distritos.

**Requisito adicional para esta versión:** ten listas **2 empresas (tenants)**
con su slug, cada una con un usuario admin y un usuario de rol limitado — los
módulos 10 y 11 solo se validan comparando entre ambas.

## 2. Autenticación y sesión (multi-tenant)

- [ ] Iniciar sesión en la Empresa A con su slug y credenciales válidas.
- [ ] Intentar entrar a la Empresa A usando el slug de la Empresa B (o viceversa) — debe rechazar.
- [ ] Fallar el login 5 veces seguidas con la misma cuenta.
- [ ] Confirmar que la cuenta queda bloqueada (RN-005) y que un admin puede desbloquearla desde Usuarios.

**Resultado esperado:** no debe ser posible operar en una empresa usando el
slug de otra; el bloqueo se activa exactamente al 5.º intento.

## 3. Empresas

- [ ] Confirmar que dentro de una empresa normal (no superadmin) el botón "Nueva empresa" **no aparece** — una empresa no puede crear otra empresa.
- [ ] Editar los datos legales/tributarios de la propia empresa y guardar.
- [ ] Ver el detalle (ícono de ojo) y confirmar que refleja los datos correctos.
- [ ] Cambiar Departamento en el formulario y confirmar que Municipio/Distrito cargan sin quedarse en "Cargando".

> El botón de crear empresa solo se habilitará desde un futuro universo de
> superadmin, que todavía no existe — su ausencia aquí es el comportamiento
> correcto.

## 4. Sucursales → Bodegas → Ubicaciones

- [ ] Crear una sucursal, verificando la cascada geográfica completa.
- [ ] Crear una bodega asociada a esa sucursal.
- [ ] Generar ubicaciones en lote dentro de la bodega (varios pasillos/niveles de una vez).
- [ ] Confirmar que los códigos generados no se duplican y siguen un patrón consistente.
- [ ] Abrir el detalle de sucursal, bodega y una ubicación.

Casos de negocio: capacidad ≤ 0 debe rechazar (RN-WHS-008); combinación
pasillo/estante/nivel/posición repetida en el mismo almacén debe rechazar
(RN-WHS-009); código de ubicación repetido en el mismo almacén debe rechazar
(RN-WHS-006).

## 5. Usuarios, roles y permisos

- [ ] Crear un rol nuevo dentro de la empresa con solo un puñado de permisos (ej. solo lectura de Productos).
- [ ] Crear un usuario con ese rol e iniciar sesión con él.
- [ ] Confirmar que los botones de crear/editar están ocultos donde no tiene permiso.
- [ ] Confirmar que la petición directa al backend (no solo el botón oculto) también rechaza la acción sin el permiso — 403, no 401.
- [ ] Confirmar que ese rol/usuario no existe ni es visible desde la otra empresa de prueba.

> Un permiso oculto solo en el frontend no es suficiente: si la petición al
> backend igual funciona sin el permiso, es un hueco de seguridad real.

## 6. Catálogos compartidos (scoped por empresa)

- [ ] En la Empresa A: crear una categoría y una subcategoría dentro de ella.
- [ ] Crear una unidad de medida.
- [ ] Crear un proveedor con código y sitio web, y agregarle un contacto.
- [ ] Cambiar a la Empresa B y confirmar que nada de lo anterior aparece en sus catálogos.

**Resultado esperado:** cada empresa ve únicamente sus propios catálogos —
categorías, unidades y proveedores no se comparten entre tenants (Fase 4 de
multi-tenancy).

## 7. Productos

- [ ] Crear un producto asignando categoría, subcategoría, unidad y proveedor.
- [ ] Confirmar que el código interno se autogenera y que el código original se puede escribir a mano.
- [ ] Intentar crear un segundo producto con el mismo SKU — debe rechazarlo.
- [ ] Subir una imagen de portada y confirmar que se ve en la vista de tarjetas.
- [ ] Alternar entre vista de tabla y de tarjetas sin recargar la página.

## 8. Kardex

- [ ] Registrar un movimiento de entrada para un producto en una ubicación específica.
- [ ] Registrar una salida parcial del mismo producto.
- [ ] Confirmar que el saldo mostrado es exactamente entradas menos salidas.
- [ ] Repetir con un segundo producto/ubicación y confirmar que los saldos no se mezclan.

> Kardex no está en el ERS — es una funcionalidad extra. Hoy es
> independiente de Retaceo: crear un retaceo **no** genera movimientos de
> kardex automáticamente; si se quiere ese vínculo, es una mejora aparte.

## 9. Compras — flujo completo (ERS v0.8, cap. 6.8)

- [ ] Crear un tipo de gasto (ej. "Transporte interno").
- [ ] Crear una solicitud de compra con al menos 2 productos distintos.
- [ ] Generar una cotización desde esa solicitud, con precios de proveedor por producto.
- [ ] Generar la orden de compra desde la cotización, agregando al menos un gasto adicional.
- [ ] Aprobar la orden de compra.

**Resultado esperado:** la orden aprobada conserva el FOB por unidad, la
cantidad de cada producto y el total de gastos adicionales — son los datos
que el Retaceo va a necesitar en el siguiente módulo.

## 10. Retaceo

> Fuera del ERS (que lo marca como "Posterior" en 6.8.3) — se construyó igual
> a pedido, con un ejemplo real verificado a la centésima.

Fórmula por producto:

```
proporción_i     = FOB_i / FOB_total
flete_i          = proporción_i × flete_total
DAI_i            = proporción_i × DAI_total
gasto_i          = proporción_i × gastos_totales
costo_unitario_i = (FOB_i + flete_i + DAI_i + gasto_i) / cantidad_i
```

- [ ] Sobre la orden aprobada del módulo 9, crear un retaceo.
- [ ] Ingresar flete y DAI de prueba, con decimales, para forzar redondeos.
- [ ] Confirmar que los gastos se toman automáticamente de los gastos adicionales de la orden.
- [ ] Calcular a mano el costo unitario de cada producto y compararlo con lo que muestra el sistema.
- [ ] Sumar los montos repartidos entre todos los productos y confirmar que cuadra exacto con flete + DAI + gastos totales.
- [ ] Intentar crear un segundo retaceo para la misma orden — debe rechazarlo.
- [ ] Confirmar que el retaceo ya creado no se puede editar ni cancelar.

> **Ojo con el redondeo:** la última línea de detalle absorbe el residuo de
> centavos para que el total cuadre exacto. Si el reparto se hizo en partes
> iguales sin ese ajuste, el total queda corrido por unos centavos — eso es
> un bug.

## 11. Bitácora

- [ ] Buscar en Bitácora la creación del producto, la orden de compra y el retaceo de este recorrido.
- [ ] Confirmar que cada entrada muestra el nombre real de la entidad, no "Desconocido".
- [ ] Confirmar que el usuario responsable de cada acción es el correcto.

Confirmar también que **no existe** ningún endpoint para editar/borrar logs
(RN-LOG-004/005) — no debería haber rutas PUT/DELETE bajo `/logs`.

## 12. Aislamiento entre empresas (cierre de la prueba general)

- [ ] Iniciar sesión en la Empresa B y revisar Productos, Proveedores, Categorías, Órdenes de compra y Retaceos.
- [ ] Confirmar que nada de lo creado en la Empresa A aparece ahí.
- [ ] Crear algo propio en la Empresa B y confirmar que tampoco se ve desde la Empresa A.
- [ ] Confirmar que usuarios y roles de una empresa no aparecen ni son seleccionables desde la otra.

**Resultado esperado:** cero filtraciones de datos entre empresas, en ambas
direcciones. Si algo se cuela, es el hallazgo más importante de toda la
pasada de pruebas.

## 13. Checklist rápido de "todo bien" antes de dar por cerrado un módulo

- [ ] Cada POST/PUT/PATCH generó su entrada en `/logs`.
- [ ] Cada `history` por entidad muestra el diff antes/después.
- [ ] Un usuario sin el permiso puntual recibe 403, no 401.
- [ ] Duplicados (NIT, NRC, código de proveedor, SKU, código de ubicación dentro de almacén) rechazan con mensaje claro.
- [ ] Desactivar un padre (empresa/sucursal/almacén) bloquea operaciones sobre hijos activos donde corresponda.
- [ ] Ningún dato de una empresa es visible desde otra.
