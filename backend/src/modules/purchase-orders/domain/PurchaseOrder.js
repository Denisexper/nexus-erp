// ERS 6.8.22: 'pending_approval', 'sent', 'partially_received', 'received' y
// 'closed' quedan reservados en el enum para etapas posteriores (aprobación
// intermedia, envío al proveedor, módulo de Recepción/Compras) — ningún
// endpoint de este módulo los expone todavía, mismo criterio que 'selected'
// en purchase-quotations.
export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'partially_received',
  'received',
  'cancelled',
  'closed',
];

export class PurchaseOrder {
  constructor({
    id,
    company,
    code,
    supplier,
    branch,
    warehouse,
    purchaseQuotation,
    user,
    orderDate,
    expectedDate,
    currency,
    paymentTerms,
    subtotal = 0,
    discount = 0,
    tax = 0,
    additionalExpenses = 0,
    total = 0,
    status = 'draft',
    notes,
    details = [],
    expenses = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company
    this.code = code; // ej: OC-00001, único por company
    this.supplier = supplier; // id de Supplier, tomado de la cotización de origen (RN-COM-014)
    this.branch = branch; // id de Branch donde se espera recibir (RN-COM-017)
    this.warehouse = warehouse; // id de Warehouse (debe pertenecer a branch)
    this.purchaseQuotation = purchaseQuotation; // id de PurchaseQuotation de origen (RN-COM-016)
    this.user = user; // id de User responsable
    this.orderDate = orderDate;
    this.expectedDate = expectedDate;
    this.currency = currency;
    this.paymentTerms = paymentTerms;
    this.subtotal = subtotal;
    this.discount = discount;
    this.tax = tax;
    this.additionalExpenses = additionalExpenses;
    this.total = total;
    this.status = status;
    this.notes = notes;
    this.details = details;
    this.expenses = expenses;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
