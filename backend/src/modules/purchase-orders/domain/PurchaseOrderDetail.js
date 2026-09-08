export class PurchaseOrderDetail {
  constructor({
    id,
    purchaseOrder,
    product,
    quantity,
    unit,
    unitPrice,
    discount = 0,
    subtotal = 0,
    taxRate = 0,
    taxAmount = 0,
    total = 0,
    notes,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.purchaseOrder = purchaseOrder; // id de PurchaseOrder
    this.product = product; // id de Product, o subdocumento poblado
    this.quantity = quantity;
    this.unit = unit; // id de Unit con type=purchase, o subdocumento poblado
    this.unitPrice = unitPrice;
    this.discount = discount;
    this.subtotal = subtotal; // (quantity * unitPrice) - discount
    this.taxRate = taxRate;
    this.taxAmount = taxAmount; // subtotal * (taxRate / 100)
    this.total = total; // subtotal + taxAmount
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
