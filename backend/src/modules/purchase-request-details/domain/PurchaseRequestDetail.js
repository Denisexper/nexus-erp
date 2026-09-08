export class PurchaseRequestDetail {
  constructor({ id, purchaseRequest, product, quantity, unit, description, notes, createdAt, updatedAt }) {
    this.id = id;
    this.purchaseRequest = purchaseRequest; // id de PurchaseRequest
    this.product = product; // id de Product, o subdocumento poblado
    this.quantity = quantity;
    this.unit = unit; // id de Unit con type=purchase, o subdocumento poblado
    this.description = description;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
