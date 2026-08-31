export class Product {
  constructor({
    id,
    company,
    subCategory,
    category,
    purchaseUnit,
    saleUnit,
    uuid,
    internalCode,
    originalCode,
    sku,
    name,
    size,
    dimensions,
    description,
    presentation,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company, o subdocumento poblado
    this.subCategory = subCategory; // id de SubCategory, o subdocumento poblado
    this.category = category; // id de Category, denormalizado desde subCategory.category (ERS v0.6)
    this.purchaseUnit = purchaseUnit; // id de Unit con type=purchase, o subdocumento poblado
    this.saleUnit = saleUnit; // id de Unit con type=sale, o subdocumento poblado
    this.uuid = uuid;
    this.internalCode = internalCode;
    this.originalCode = originalCode;
    this.sku = sku;
    this.name = name;
    this.size = size;
    this.dimensions = dimensions;
    this.description = description;
    this.presentation = presentation;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
