export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseQuotationNotFoundError extends DomainError {
  constructor() {
    super('Cotización de compra no encontrada');
  }
}

export class InvalidPurchaseQuotationIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class SupplierNotFoundForQuotationError extends DomainError {
  constructor() {
    super('El proveedor indicado no existe');
  }
}

export class EmptyPurchaseQuotationError extends DomainError {
  constructor() {
    super('La cotización necesita al menos una línea de producto');
  }
}

export class ProductNotFoundForQuotationError extends DomainError {
  constructor() {
    super('El producto indicado no existe');
  }
}

export class UnitNotFoundForQuotationError extends DomainError {
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

export class InvalidUnitPriceError extends DomainError {
  constructor() {
    super('El precio unitario debe ser mayor o igual a cero');
  }
}

export class ExpenseTypeNotFoundForQuotationError extends DomainError {
  constructor() {
    super('El tipo de gasto indicado no existe');
  }
}

export class NoSourcesForQuotationLineError extends DomainError {
  constructor() {
    super('Cada línea debe originarse en al menos una línea de una solicitud de compra');
  }
}

export class PurchaseRequestDetailNotFoundForQuotationError extends DomainError {
  constructor() {
    super('Una de las líneas de solicitud indicadas no existe');
  }
}

export class PurchaseRequestNotQuotableError extends DomainError {
  constructor() {
    super('La solicitud de origen debe estar aprobada para poder cotizarse');
  }
}

export class ProductMismatchError extends DomainError {
  constructor() {
    super('El producto de la línea no coincide con el producto de la solicitud de origen');
  }
}

export class SourceQuantityExceedsRequestError extends DomainError {
  constructor() {
    super('La cantidad de origen no puede superar la cantidad solicitada en esa línea');
  }
}

export class PurchaseRequestNotFoundForQuotationComparisonError extends DomainError {
  constructor() {
    super('La solicitud de compra indicada no existe');
  }
}

export class PurchaseQuotationNotEditableError extends DomainError {
  constructor() {
    super('La cotización solo puede editarse mientras está en estado recibida');
  }
}

export class InvalidPurchaseQuotationStatusTransitionError extends DomainError {
  constructor(from, to) {
    super(`No se puede pasar la cotización de "${from}" a "${to}"`);
  }
}
