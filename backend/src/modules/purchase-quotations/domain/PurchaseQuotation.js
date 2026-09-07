// 'selected' queda reservado para cuando exista el módulo de órdenes
// (module 4): esta cotización no expone un endpoint para setearlo, solo lo
// hará purchase-orders al generar una orden desde ella (mismo criterio que
// partially_quoted/quoted/partially_ordered/completed en PurchaseRequest).
export const PURCHASE_QUOTATION_STATUSES = ['received', 'selected', 'rejected', 'cancelled'];

export class PurchaseQuotation {
  constructor({
    id,
    company,
    code,
    supplier,
    quotationDate,
    validUntil,
    currency,
    paymentTerms,
    deliveryDays,
    subtotal = 0,
    discount = 0,
    tax = 0,
    additionalExpenses = 0,
    total = 0,
    status = 'received',
    notes,
    user,
    details = [],
    expenses = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company
    this.code = code; // ej: COT-00001, único por company
    this.supplier = supplier; // id de Supplier, o subdocumento poblado
    this.quotationDate = quotationDate;
    this.validUntil = validUntil;
    this.currency = currency;
    this.paymentTerms = paymentTerms;
    this.deliveryDays = deliveryDays; // estimado general de la cotización
    this.subtotal = subtotal; // SUM(detail.subtotal), ya neto de descuento de línea
    this.discount = discount; // SUM(detail.discount), informativo (ya incluido en subtotal)
    this.tax = tax; // SUM(detail.taxAmount)
    this.additionalExpenses = additionalExpenses; // SUM(expenses.amount)
    this.total = total; // subtotal + tax + additionalExpenses
    this.status = status;
    this.notes = notes;
    this.user = user; // id de User que registra la cotización, o subdocumento poblado
    this.details = details; // PurchaseQuotationDetail[]
    this.expenses = expenses; // [{ id, expenseType, description, amount }]
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
