// ERS v0.9 cap. 6.8.21/6.8.25. Representa la recepción real de mercancía
// contra una orden de compra aprobada. 'verified' y 'closed' quedan
// reservados en el enum para etapas posteriores (conciliación contable),
// mismo criterio que los estados no usados aún de purchase_orders: esta
// primera versión nace directo en 'received' (sin flujo de borrador), igual
// que retaceos y purchase-quotations.
export const PURCHASE_STATUSES = ['received', 'verified', 'cancelled', 'closed'];

export class Purchase {
  constructor({
    id,
    company,
    code,
    purchaseOrder,
    supplier,
    branch,
    warehouse,
    purchaseDate,
    supplierInvoiceNumber,
    supplierInvoiceDate,
    currency,
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    status = 'received',
    notes,
    user,
    details = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company
    this.code = code; // ej: C-00001, único por company
    this.purchaseOrder = purchaseOrder; // id de PurchaseOrder de origen (debe estar 'approved' o 'partially_received')
    this.supplier = supplier; // id de Supplier, denormalizado de la orden de origen
    this.branch = branch; // id de Branch, denormalizado de la orden de origen
    this.warehouse = warehouse; // id de Warehouse, denormalizado de la orden de origen
    this.purchaseDate = purchaseDate;
    this.supplierInvoiceNumber = supplierInvoiceNumber;
    this.supplierInvoiceDate = supplierInvoiceDate;
    this.currency = currency;
    this.subtotal = subtotal; // SUM(detail.subtotal)
    this.discount = discount; // SUM(detail.discount)
    this.tax = tax; // SUM(detail.taxAmount)
    this.total = total; // subtotal + tax
    this.status = status;
    this.notes = notes;
    this.user = user; // id de User que registra la recepción
    this.details = details; // PurchaseDetail[]
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
