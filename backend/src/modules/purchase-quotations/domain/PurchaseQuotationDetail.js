export class PurchaseQuotationDetail {
  constructor({
    id,
    purchaseQuotation,
    product,
    quantity,
    unit,
    unitPrice,
    discount = 0,
    subtotal = 0,
    taxRate = 0,
    taxAmount = 0,
    total = 0,
    deliveryDays,
    availableQuantity,
    notes,
    sources = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.purchaseQuotation = purchaseQuotation; // id de PurchaseQuotation
    this.product = product; // id de Product, o subdocumento poblado
    this.quantity = quantity; // SUM(sources.quantity), calculado
    this.unit = unit; // id de Unit con type=purchase, o subdocumento poblado
    this.unitPrice = unitPrice;
    this.discount = discount;
    this.subtotal = subtotal; // (quantity * unitPrice) - discount
    this.taxRate = taxRate;
    this.taxAmount = taxAmount; // subtotal * (taxRate / 100)
    this.total = total; // subtotal + taxAmount
    this.deliveryDays = deliveryDays;
    this.availableQuantity = availableQuantity;
    this.notes = notes;
    // Trazabilidad (Regla 4 del ERS): de qué línea(s) de qué solicitud(es)
    // sale la cantidad consolidada de esta línea. [{ purchaseRequestDetail, quantity }]
    this.sources = sources;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
