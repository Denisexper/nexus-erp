export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductNotFoundError extends DomainError {
  constructor() {
    super('Producto no encontrado');
  }
}

export class InvalidProductIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class SubCategoryNotFoundForProductError extends DomainError {
  constructor() {
    super('La sub-categoría indicada no existe');
  }
}

export class UnitNotFoundForProductError extends DomainError {
  constructor() {
    super('Una de las unidades indicadas no existe');
  }
}

export class InvalidPurchaseUnitTypeError extends DomainError {
  constructor() {
    super('La unidad de compra debe ser una unidad de tipo compra');
  }
}

export class InvalidSaleUnitTypeError extends DomainError {
  constructor() {
    super('La unidad de venta debe ser una unidad de tipo venta');
  }
}

export class DuplicateInternalCodeError extends DomainError {
  constructor() {
    super('Ya existe un producto con ese código interno');
  }
}

export class DuplicateSkuError extends DomainError {
  constructor() {
    super('Ya existe un producto con ese SKU');
  }
}
