export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseRequestDetailNotFoundError extends DomainError {
  constructor() {
    super('Línea de solicitud no encontrada');
  }
}

export class InvalidPurchaseRequestDetailIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseRequestNotFoundForDetailError extends DomainError {
  constructor() {
    super('La solicitud de compra indicada no existe');
  }
}

export class PurchaseRequestNotEditableForDetailError extends DomainError {
  constructor() {
    super('La solicitud solo puede modificarse mientras está en borrador');
  }
}

export class ProductNotFoundForDetailError extends DomainError {
  constructor() {
    super('El producto indicado no existe');
  }
}

export class UnitNotFoundForDetailError extends DomainError {
  constructor() {
    super('La unidad indicada no existe');
  }
}

export class InvalidPurchaseUnitError extends DomainError {
  constructor() {
    super('La unidad debe ser de tipo compra');
  }
}

export class InvalidQuantityError extends DomainError {
  constructor() {
    super('La cantidad debe ser mayor que cero');
  }
}
