export class PurchaseDetail {
  constructor({
    id,
    purchase,
    purchaseOrderDetail,
    product,
    quantityOrdered,
    quantityReceived,
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
    this.purchase = purchase; // id de Purchase
    this.purchaseOrderDetail = purchaseOrderDetail; // id de PurchaseOrderDetail (trazabilidad, ERS 6.8.22)
    this.product = product; // id de Product, o subdocumento poblado
    this.quantityOrdered = quantityOrdered; // copiada de purchase_order_details.quantity al momento de recibir
    this.quantityReceived = quantityReceived; // cantidad realmente recibida en esta compra
    this.unit = unit; // id de Unit, o subdocumento poblado
    this.unitPrice = unitPrice; // copiado de purchase_order_details
    this.discount = discount; // proporcional a quantityReceived/quantityOrdered
    this.subtotal = subtotal; // (quantityReceived * unitPrice) - discount
    this.taxRate = taxRate;
    this.taxAmount = taxAmount; // subtotal * (taxRate / 100)
    this.total = total; // subtotal + taxAmount
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
