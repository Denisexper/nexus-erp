export class ProductImage {
  constructor({ id, uuid, productId, path, isActive = true, createdAt, updatedAt }) {
    this.id = id;
    this.uuid = uuid;
    this.productId = productId;
    this.path = path;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
