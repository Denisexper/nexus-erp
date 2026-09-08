# Especificación Funcional y Técnica: Proceso de Compras del Mini ERP

**Documento de referencia para el desarrollo de módulos de Solicitud de Compras, Cotizaciones y Órdenes de Compra**

---

## 1. Visión General

El proceso de compras del Mini ERP se diseña como un flujo controlado y trazable:

```
SOLICITUD DE COMPRA
        │
        ▼
DETALLE DE SOLICITUD
        │
        ▼
SOLICITUD DE COTIZACIONES
        │
        ▼
COTIZACIONES DE PROVEEDORES
        │
        ▼
COMPARACIÓN DE COTIZACIONES
        │
        ▼
SELECCIÓN DE PROVEEDOR
        │
        ▼
ORDEN DE COMPRA
        │
        ▼
RECEPCIÓN / COMPRA
        │
        ▼
RETACEO
        │
        ▼
INVENTARIO
```

**Ventaja clave:** Cada etapa tiene una responsabilidad diferente y queda registrada en el sistema. Por ejemplo, una necesidad de 100 unidades de un producto comienza como una solicitud interna, recibe cotizaciones, se selecciona un proveedor y termina en una orden de compra.

---

## 2. Principios de Diseño

Antes de revisar las tablas, establecemos 6 reglas fundamentales que guían toda la arquitectura:

### Regla 1: Una solicitud puede contener múltiples productos

Una solicitud centraliza la necesidad de varios artículos.

**Ejemplo:**
```
SCR-0001
Sucursal: San Miguel
Almacén: Principal

Producto A     100 unidades
Producto B      50 cajas
Producto C      25 unidades
```

### Regla 2: Una solicitud puede ser cotizada con varios proveedores

Es normal solicitar presupuestos a múltiples proveedores para comparar.

**Ejemplo:**
```
SCR-0001
   │
   ├── COT-001 → Proveedor A
   ├── COT-002 → Proveedor B
   └── COT-003 → Proveedor C
```

### Regla 3: Una cotización puede consolidar varias solicitudes

Un proveedor puede responder a múltiples solicitudes en una sola cotización.

**Ejemplo:**
```
SCR-001 ──┐
SCR-002 ──┼──► COT-005 → Proveedor A
SCR-003 ──┘
```

### Regla 4: Se mantiene trazabilidad a nivel de producto

No basta saber que `COT-005` proviene de `SCR-001` y `SCR-002`. Debemos poder identificar exactamente qué productos de qué solicitudes componen la cotización.

**Ejemplo:**
```
COT-005
Producto A → 30 (de SCR-001)
Producto A → 20 (de SCR-002)
Producto B → 15 (de SCR-001)
```

### Regla 5: Una Orden de Compra pertenece a un único proveedor

**Regla fundamental:** `Una Orden de Compra = Un proveedor`

```
ORD-001 → Proveedor A
ORD-002 → Proveedor B
ORD-003 → Proveedor C
```

Una solicitud puede terminar generando varias órdenes si se distribuye entre proveedores:

```
SCR-001
   │
   ├── ORD-001 → Proveedor A
   ├── ORD-002 → Proveedor B
   └── ORD-003 → Proveedor C
```

### Regla 6: Los gastos adicionales no serán campos individuales

No tendremos campos permanentes como:
```
freight
insurance
other_costs
```

En su lugar, usamos un catálogo (`expense_types`) y tablas de gastos que permiten registrar:

- Flete
- Seguro
- Transporte
- Manejo
- Embalaje
- Gastos aduanales
- Documentación
- Almacenamiento
- Otros

Esta flexibilidad es clave para el módulo de retaceo posterior.

---

## 3. Módulo de Solicitudes de Compra

La solicitud representa una **necesidad interna de abastecimiento**. No es todavía una compra.

Un usuario indica: *"Necesitamos 100 unidades del producto X para el almacén principal".*

### 3.1 Tabla: `purchase_requests`

Encabezado de la solicitud

```sql
CREATE TABLE purchase_requests (
  id_purchase_request INT PRIMARY KEY,
  uuid VARCHAR(36),
  purchase_request_code VARCHAR(20),
  id_branch INT FOREIGN KEY,
  id_warehouse INT FOREIGN KEY,
  id_user INT FOREIGN KEY,
  request_date DATETIME,
  required_date DATETIME,
  justification TEXT,
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME
);
```

**Función de cada campo:**

| Campo | Descripción |
|-------|-------------|
| `id_purchase_request` | Identificador interno único |
| `uuid` | Identificador único externo (para integraciones) |
| `purchase_request_code` | Código visible, ej: SCR-00001 |
| `id_branch` | Sucursal que realiza la solicitud |
| `id_warehouse` | Almacén que necesita los productos |
| `id_user` | Usuario que crea la solicitud |
| `request_date` | Fecha de creación |
| `required_date` | Fecha en que se necesitan los productos |
| `justification` | Motivo de la solicitud |
| `status` | Estado actual del proceso |
| `notes` | Observaciones adicionales |
| `created_at` | Timestamp de registro |

---

## 4. Detalle de la Solicitud

Una solicitud puede contener muchos productos. Por eso separamos encabezado y detalle.

### Tabla: `purchase_request_details`

```sql
CREATE TABLE purchase_request_details (
  id_purchase_request_detail INT PRIMARY KEY,
  id_purchase_request INT FOREIGN KEY,
  id_product INT FOREIGN KEY,
  quantity DECIMAL(12,2),
  id_unit INT FOREIGN KEY,
  description VARCHAR(500),
  notes TEXT
);
```

**Relación:**
```
purchase_requests (1) ──── (N) purchase_request_details
```

Una solicitud contiene múltiples líneas de detalle:

```
Una solicitud
   │
   ├── Producto A (100 unidades)
   ├── Producto B (50 cajas)
   └── Producto C (20 unidades)
```

---

## 5. Estados de la Solicitud

El ciclo de vida de una solicitud progresa a través de estos estados:

```
draft
   ↓
submitted
   ↓
approved
   ↓
partially_quoted
   ↓
quoted
   ↓
partially_ordered
   ↓
completed
```

**Estados adicionales:**
- `rejected` - Si la solicitud es rechazada
- `cancelled` - Si se cancela

Esto permite controlar el avance de cada solicitud y automatizar notificaciones.

---

## 6. Cotizaciones de Compra

Una cotización representa la **propuesta comercial recibida de un proveedor**.

### Tabla: `purchase_quotations`

```sql
CREATE TABLE purchase_quotations (
  id_purchase_quotation INT PRIMARY KEY,
  uuid VARCHAR(36),
  purchase_quotation_code VARCHAR(20),
  id_supplier INT FOREIGN KEY,
  quotation_date DATETIME,
  valid_until DATETIME,
  currency VARCHAR(3),
  payment_terms VARCHAR(100),
  delivery_days INT,
  subtotal DECIMAL(12,2),
  discount DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2),
  status VARCHAR(50),
  notes TEXT,
  id_user INT FOREIGN KEY,
  created_at DATETIME
);
```

**Nota importante:** No incluimos campos como `freight`, `insurance`, `other_costs`. Los gastos se manejan mediante tablas específicas para mayor flexibilidad.

---

## 7. Detalle de Cotización

```sql
CREATE TABLE purchase_quotation_details (
  id_purchase_quotation_detail INT PRIMARY KEY,
  id_purchase_quotation INT FOREIGN KEY,
  id_product INT FOREIGN KEY,
  quantity DECIMAL(12,2),
  id_unit INT FOREIGN KEY,
  unit_price DECIMAL(12,4),
  discount DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  delivery_days INT,
  available_quantity DECIMAL(12,2),
  notes TEXT
);
```

**Relación:**
```
purchase_quotations (1) ──── (N) purchase_quotation_details
```

---

## 8. ¿Por qué `tax_rate` y `tax_amount`?

En lugar de un único campo `tax` por línea, separamos:

```
tax_rate     → El porcentaje (ej: 13%)
tax_amount   → El monto calculado
```

**Ejemplo:**
```
Producto A
Cantidad: 100
Precio unitario: $10

Subtotal: 100 × $10 = $1,000
Descuento: -$0
Subtotal neto: $1,000
Tasa de impuesto: 13%
Impuesto: $1,000 × 13% = $130
Total: $1,130
```

**Fórmulas:**
```
subtotal = (quantity × unit_price) - discount
tax_amount = subtotal × (tax_rate / 100)
total = subtotal + tax_amount
```

El impuesto del encabezado se calcula así:
```
purchase_quotations.tax = SUM(purchase_quotation_details.tax_amount)
```

**Importante:** El usuario no debe escribir manualmente el impuesto total. El sistema lo calcula.

---

## 9. Relación Solicitud ↔ Cotización

Este fue uno de los puntos más importantes del diseño.

Una solicitud puede tener múltiples cotizaciones:
```
SCR-001
   ├── COT-001 → Proveedor A
   ├── COT-002 → Proveedor B
   └── COT-003 → Proveedor C
```

Pero también, una cotización puede consolidar varias solicitudes:
```
COT-005
   ├── SCR-001
   ├── SCR-002
   └── SCR-003
```

Por lo tanto, tenemos una **relación N:M** que se resuelve con:

### Tabla: `purchase_quotation_requests`

```sql
CREATE TABLE purchase_quotation_requests (
  id_purchase_quotation_request INT PRIMARY KEY,
  id_purchase_quotation INT FOREIGN KEY,
  id_purchase_request INT FOREIGN KEY,
  created_at DATETIME
);
```

**Relaciones:**
```
purchase_requests (1) ──── (N) purchase_quotation_requests
purchase_quotations (1) ──── (N) purchase_quotation_requests
```

---

## 10. Trazabilidad a Nivel de Detalle

Esta tabla es fundamental para mantener trazabilidad exacta del origen de cada cantidad.

### Tabla: `purchase_quotation_request_details`

```sql
CREATE TABLE purchase_quotation_request_details (
  id_purchase_quotation_request_detail INT PRIMARY KEY,
  id_purchase_quotation_detail INT FOREIGN KEY,
  id_purchase_request_detail INT FOREIGN KEY,
  quantity DECIMAL(12,2),
  created_at DATETIME
);
```

**Relaciones:**
```
purchase_request_details (1) ──── (N) purchase_quotation_request_details
purchase_quotation_details (1) ──── (N) purchase_quotation_request_details
```

### Ejemplo de Trazabilidad

Solicitud:
```
SCR-001
Producto A → 50 unidades
```

Solicitud:
```
SCR-002
Producto A → 30 unidades
```

Cotización:
```
COT-001
Producto A → 80 unidades
```

La tabla registra:

| id_quotation_detail | id_request_detail | quantity |
|---|---|---|
| COT-001-ProductoA | SCR-001-ProductoA | 50 |
| COT-001-ProductoA | SCR-002-ProductoA | 30 |

Así el sistema sabe exactamente cómo se originaron las 80 unidades.

---

## 11. Gestión de Gastos: `expense_types`

En lugar de campos fijos en las tablas, usamos un catálogo de tipos de gasto.

### Tabla: `expense_types`

```sql
CREATE TABLE expense_types (
  id_expense_type INT PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN
);
```

**Ejemplo de datos:**

| id | name | description |
|---|---|---|
| 1 | Flete | Transporte de mercancía |
| 2 | Seguro | Seguros de envío |
| 3 | Transporte | Costos de transporte interno |
| 4 | Manejo | Manipulación y carga |
| 5 | Embalaje | Materiales de empaque |
| 6 | Almacenamiento | Almacenamiento temporal |
| 7 | Gastos aduanales | Aranceles y trámites aduanales |
| 8 | Documentación | Documentación de envío |
| 9 | Otros | Otros gastos varios |

---

## 12. Gastos de Cotización

Los gastos indicados por el proveedor se almacenan en:

### Tabla: `purchase_quotation_expenses`

```sql
CREATE TABLE purchase_quotation_expenses (
  id_purchase_quotation_expense INT PRIMARY KEY,
  id_purchase_quotation INT FOREIGN KEY,
  id_expense_type INT FOREIGN KEY,
  description VARCHAR(500),
  amount DECIMAL(12,2),
  created_at DATETIME
);
```

**Relaciones:**
```
purchase_quotations (1) ──── (N) purchase_quotation_expenses
expense_types (1) ──── (N) purchase_quotation_expenses
```

### Ejemplo de Cotización con Gastos

```
COT-001

Productos              $10,000
Descuento                 $500
Impuestos               $1,235

Gastos:
├── Flete                 $300
├── Seguro                $150
└── Manejo                 $50

Gastos adicionales total: $500
Total final: $10,000 - $500 + $1,235 + $500 = $11,235
```

---

## 13. Comparación de Cotizaciones

Con esta estructura podemos construir un módulo de comparación robusto.

### Ejemplo Comparativo

| Concepto | Proveedor A | Proveedor B | Proveedor C |
|---|---|---|---|
| Productos | $10,000 | $9,700 | $10,200 |
| Descuento | $500 | $200 | $800 |
| Impuestos | $1,235 | $1,235 | $1,222 |
| Flete | $300 | $500 | $200 |
| Seguro | $150 | $100 | $200 |
| **Total** | **$11,185** | **$11,335** | **$10,822** |
| Entrega | 5 días | 10 días | 7 días |

**Análisis:**
- Proveedor C tiene el menor costo total ($10,822)
- Proveedor A tiene entrega más rápida (5 días)
- Proveedor B es el más caro pero tiene buena disponibilidad

**Criterios de decisión:**
- Precio
- Descuento
- Impuestos
- Gastos
- Disponibilidad
- Tiempo de entrega
- Condiciones de pago
- Vigencia de cotización
- Historial del proveedor

---

## 14. Orden de Compra

Una vez seleccionada la cotización, se genera la orden.

### Regla Principal

> **Una Orden de Compra pertenece a un único proveedor**

```
ORD-001 → Proveedor A (✓ Correcto)
ORD-001 → Proveedor A + Proveedor B (✗ Incorrecto)
```

Si se necesitan dos proveedores, se crean dos órdenes:
```
ORD-001 → Proveedor A
ORD-002 → Proveedor B
```

---

## 15. Tabla: `purchase_orders`

```sql
CREATE TABLE purchase_orders (
  id_purchase_order INT PRIMARY KEY,
  uuid VARCHAR(36),
  purchase_order_code VARCHAR(20),
  id_supplier INT FOREIGN KEY,
  id_branch INT FOREIGN KEY,
  id_warehouse INT FOREIGN KEY,
  id_purchase_quotation INT FOREIGN KEY,
  id_user INT FOREIGN KEY,
  order_date DATETIME,
  expected_date DATETIME,
  currency VARCHAR(3),
  payment_terms VARCHAR(100),
  subtotal DECIMAL(12,2),
  discount DECIMAL(12,2),
  tax DECIMAL(12,2),
  additional_expenses DECIMAL(12,2),
  total DECIMAL(12,2),
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME
);
```

**Campos clave:**

| Campo | Descripción |
|---|---|
| `id_supplier` | Proveedor único para esta orden |
| `id_purchase_quotation` | Cotización de referencia (trazabilidad) |
| `order_date` | Fecha de generación de la orden |
| `expected_date` | Fecha esperada de entrega |
| `additional_expenses` | Suma de gastos (calculado) |
| `status` | Estado actual: draft, sent, confirmed, received, invoiced, etc. |

---

## 16. Detalle de Orden

```sql
CREATE TABLE purchase_order_details (
  id_purchase_order_detail INT PRIMARY KEY,
  id_purchase_order INT FOREIGN KEY,
  id_product INT FOREIGN KEY,
  quantity DECIMAL(12,2),
  id_unit INT FOREIGN KEY,
  unit_price DECIMAL(12,4),
  discount DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  notes TEXT
);
```

**Relación:**
```
purchase_orders (1) ──── (N) purchase_order_details
```

---

## 17. Gastos de la Orden

Los gastos acordados definitivamente se almacenan en:

### Tabla: `purchase_order_expenses`

```sql
CREATE TABLE purchase_order_expenses (
  id_purchase_order_expense INT PRIMARY KEY,
  id_purchase_order INT FOREIGN KEY,
  id_expense_type INT FOREIGN KEY,
  description VARCHAR(500),
  amount DECIMAL(12,2),
  created_at DATETIME
);
```

**Relaciones:**
```
purchase_orders (1) ──── (N) purchase_order_expenses
expense_types (1) ──── (N) purchase_order_expenses
```

---

## 18. Diferencia entre Gastos de Cotización y Gastos de Orden

### Gastos de Cotización

Son gastos **ofertados** por el proveedor:

```
Proveedor dice en la cotización:

Flete → $500
Seguro → $200
```

### Gastos de Orden

Son gastos **acordados** después de negociación:

```
Después de negociar:

Flete → $450
Seguro → $200
```

**Importante:** No debemos asumir que los gastos de la cotización serán exactamente iguales a los de la orden. Por eso son tablas separadas.

---

## 19. Cálculo de la Orden

En la tabla `purchase_orders`:

```
subtotal                = Suma de subtotales de detalles
discount                = Descuento aplicado
tax                     = Suma de impuestos de detalles
additional_expenses     = SUM(purchase_order_expenses.amount)
total                   = subtotal - discount + tax + additional_expenses
```

**El campo `additional_expenses` es calculado**, no debe ingresarse manualmente:

```sql
additional_expenses = SUM(
  SELECT amount FROM purchase_order_expenses
  WHERE id_purchase_order = X
)
```
---

## 20. Retaceo: Distribución de Gastos

Una de las mayores ventajas de este diseño es la preparación para el retaceo.

Los gastos adicionales no solo sirven para determinar cuánto se pagará, sino también para calcular el **costo real de adquisición de cada producto**.

### Ejemplo de Retaceo

```
Orden de Compra
Productos adquiridos          $10,000

Gastos adicionales:
├── Flete                       $500
├── Seguro                      $200
└── Transporte                  $300
Total gastos                   $1,000
----------------------------------
Costo total                   $11,000
```

El retaceo distribuye los $1,000 de gastos entre los productos:

```
Producto A
Costo original       $5,000
Gastos asignados       $500  (proporcional)
Costo real           $5,500

Producto B
Costo original       $3,000
Gastos asignados       $300  (proporcional)
Costo real           $3,300

Producto C
Costo original       $2,000
Gastos asignados       $200  (proporcional)
Costo real           $2,200
```

Este **costo real** será posteriormente muy importante para:
- Asignación de precios de venta
- Análisis de márgenes
- Valuación de inventario

---

## 21. Flujo completo con ejemplo

Supongamos que el almacén necesita:

```
100 unidades Producto A
50 unidades Producto B
```

### Paso 1 — Solicitud

Se crea:

```
SCR-0001
```

con:

```
Producto A → 100
Producto B → 50
```

---

### Paso 2 — Aprobación

El responsable aprueba:

```
SCR-0001
Estado: APPROVED
```

---

### Paso 3 — Cotización

El comprador solicita cotizaciones.

Proveedor A:

```
COT-001
A → $10
B → $20
Flete → $300
```

Proveedor B:

```
COT-002
A → $9.50
B → $22
Flete → $200
```

Proveedor C:

```
COT-003
A → $10
B → $19
Flete → $400
```

---

## 22. Comparación

El sistema calcula el costo total de cada propuesta.

Por ejemplo:

```
Proveedor A → $2,850
Proveedor B → $2,700
Proveedor C → $2,750
```

Pero además muestra:

```
Proveedor A
Entrega: 3 días

Proveedor B
Entrega: 10 días

Proveedor C
Entrega: 5 días
```

El usuario puede decidir seleccionar B por precio o A por rapidez.

---

## 23. Generación de Orden

Supongamos que seleccionamos Proveedor A.

Se genera:

```
ORD-0001
Proveedor: A
```

La orden contiene:

```
Producto A → 100
Producto B → 50
```

Y:

```
Flete → $250
Seguro → $100
```

---

## 24. Caso: Una Solicitud Genera Varias Órdenes

Supongamos que Proveedor A solo puede entregar:
- Producto A → 100 (completo)
- Producto B → NO disponible

**Solución:**
```
SCR-0001
   │
   ├── ORD-0001 → Proveedor A
   │      └── Producto A → 100
   │
   └── ORD-0002 → Proveedor B
          └── Producto B → 50
```

La solicitud queda en estado `partially_ordered` hasta completar todos sus productos.

---

## 25. Relaciones Completas del Modelo

```
purchase_requests (1) ─────── (N) purchase_request_details
        │
        │ (N:M)
        │
purchase_quotation_requests
        │
purchase_quotations (1) ─────── (N) purchase_quotation_details
        │                        │
        │                    (N:M)
        │                        │
        └── (1) purchase_quotation_request_details
        │
        ├─── (1) purchase_quotation_expenses
        │
        └─── (1) purchase_orders
                 │
                 ├─── (1) purchase_order_details
                 │
                 └─── (1) purchase_order_expenses

expense_types
        │
        ├─── (1) purchase_quotation_expenses
        │
        └─── (1) purchase_order_expenses
```

---

## 26. Esquema Completo en SQL

```sql
-- Tablas principales
purchase_requests (
  id_purchase_request INT PK,
  uuid VARCHAR(36),
  purchase_request_code VARCHAR(20),
  id_branch INT FK,
  id_warehouse INT FK,
  id_user INT FK,
  request_date DATETIME,
  required_date DATETIME,
  justification TEXT,
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME
)

purchase_request_details (
  id_purchase_request_detail INT PK,
  id_purchase_request INT FK,
  id_product INT FK,
  quantity DECIMAL(12,2),
  id_unit INT FK,
  description VARCHAR(500),
  notes TEXT
)

purchase_quotations (
  id_purchase_quotation INT PK,
  uuid VARCHAR(36),
  purchase_quotation_code VARCHAR(20),
  id_supplier INT FK,
  quotation_date DATETIME,
  valid_until DATETIME,
  currency VARCHAR(3),
  payment_terms VARCHAR(100),
  delivery_days INT,
  subtotal DECIMAL(12,2),
  discount DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2),
  status VARCHAR(50),
  notes TEXT,
  id_user INT FK,
  created_at DATETIME
)

purchase_quotation_details (
  id_purchase_quotation_detail INT PK,
  id_purchase_quotation INT FK,
  id_product INT FK,
  quantity DECIMAL(12,2),
  id_unit INT FK,
  unit_price DECIMAL(12,4),
  discount DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  delivery_days INT,
  available_quantity DECIMAL(12,2),
  notes TEXT
)

purchase_quotation_requests (
  id_purchase_quotation_request INT PK,
  id_purchase_quotation INT FK,
  id_purchase_request INT FK,
  created_at DATETIME
)

purchase_quotation_request_details (
  id_purchase_quotation_request_detail INT PK,
  id_purchase_quotation_detail INT FK,
  id_purchase_request_detail INT FK,
  quantity DECIMAL(12,2),
  created_at DATETIME
)

expense_types (
  id_expense_type INT PK,
  name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN
)

purchase_quotation_expenses (
  id_purchase_quotation_expense INT PK,
  id_purchase_quotation INT FK,
  id_expense_type INT FK,
  description VARCHAR(500),
  amount DECIMAL(12,2),
  created_at DATETIME
)

purchase_orders (
  id_purchase_order INT PK,
  uuid VARCHAR(36),
  purchase_order_code VARCHAR(20),
  id_supplier INT FK,
  id_branch INT FK,
  id_warehouse INT FK,
  id_purchase_quotation INT FK,
  id_user INT FK,
  order_date DATETIME,
  expected_date DATETIME,
  currency VARCHAR(3),
  payment_terms VARCHAR(100),
  subtotal DECIMAL(12,2),
  discount DECIMAL(12,2),
  tax DECIMAL(12,2),
  additional_expenses DECIMAL(12,2),
  total DECIMAL(12,2),
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME
)

purchase_order_details (
  id_purchase_order_detail INT PK,
  id_purchase_order INT FK,
  id_product INT FK,
  quantity DECIMAL(12,2),
  id_unit INT FK,
  unit_price DECIMAL(12,4),
  discount DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  notes TEXT
)

purchase_order_expenses (
  id_purchase_order_expense INT PK,
  id_purchase_order INT FK,
  id_expense_type INT FK,
  description VARCHAR(500),
  amount DECIMAL(12,2),
  created_at DATETIME
)

-- Relaciones de claves foráneas
purchase_requests.id_purchase_request < purchase_request_details.id_purchase_request
purchase_requests.id_purchase_request < purchase_quotation_requests.id_purchase_request

purchase_quotations.id_purchase_quotation < purchase_quotation_details.id_purchase_quotation
purchase_quotations.id_purchase_quotation < purchase_quotation_requests.id_purchase_quotation
purchase_quotations.id_purchase_quotation < purchase_quotation_expenses.id_purchase_quotation
purchase_quotations.id_purchase_quotation < purchase_orders.id_purchase_quotation

purchase_request_details.id_purchase_request_detail < purchase_quotation_request_details.id_purchase_request_detail

purchase_quotation_details.id_purchase_quotation_detail < purchase_quotation_request_details.id_purchase_quotation_detail

expense_types.id_expense_type < purchase_quotation_expenses.id_expense_type
expense_types.id_expense_type < purchase_order_expenses.id_expense_type

purchase_orders.id_purchase_order < purchase_order_details.id_purchase_order
purchase_orders.id_purchase_order < purchase_order_expenses.id_purchase_order
```

---

## 27. Resumen Conceptual

El diseño permite pasar de:

> **"Necesitamos comprar estos productos"**

a:

> **"Solicitamos cotización a estos proveedores"**

luego:

> **"Comparamos sus condiciones y costos totales"**

después:

> **"Seleccionamos este proveedor"**

y finalmente:

> **"Generamos una orden de compra para ese único proveedor"**

### Trazabilidad Completa

Lo más importante es que no perdemos la trazabilidad en ningún momento:

```
Solicitud
   ↓
Producto solicitado (con cantidad)
   ↓
Solicitud de Cotización
   ↓
Producto cotizado (con cantidad)
   ↓
Proveedor seleccionado
   ↓
Orden de Compra
   ↓
Gastos adicionales
   ↓
Recepción / Compra
   ↓
Retaceo (distribución de gastos)
   ↓
Costo real de producto
   ↓
Precio de venta
```

### Preparación para Módulos Posteriores

Esta arquitectura deja al Mini ERP preparado para que los siguientes módulos funcionen sin necesidad de rediseño:

- **Recepción / Ingreso**
- **Retaceo y distribución de gastos**
- **Inventario**
- **Asignación de precios de venta**

---