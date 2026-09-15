export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseNotFoundError extends DomainError {
  constructor() {
    super('Compra no encontrada');
  }
}

export class InvalidPurchaseIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseOrderNotFoundForPurchaseError extends DomainError {
  constructor() {
    super('La orden de compra indicada no existe');
  }
}

export class PurchaseOrderNotReceivableError extends DomainError {
  constructor() {
    super('Solo se puede registrar una recepción sobre una orden aprobada o parcialmente recibida');
  }
}

export class PurchaseOrderDetailNotFoundError extends DomainError {
  constructor() {
    super('Una de las líneas indicadas no pertenece a la orden de compra');
  }
}

export class QuantityReceivedExceedsOrderedError extends DomainError {
  constructor() {
    super('La cantidad recibida supera lo pendiente de esa línea de la orden');
  }
}

export class InvalidQuantityReceivedError extends DomainError {
  constructor() {
    super('La cantidad recibida debe ser mayor que cero');
  }
}

export class EmptyPurchaseError extends DomainError {
  constructor() {
    super('Debe registrar al menos una línea con cantidad recibida');
  }
}

export class PurchaseNotCancellableError extends DomainError {
  constructor() {
    super('Solo se puede cancelar una compra recién registrada');
  }
}
