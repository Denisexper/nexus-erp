export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseRequestNotFoundError extends DomainError {
  constructor() {
    super('Solicitud de compra no encontrada');
  }
}

export class InvalidPurchaseRequestIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class BranchNotFoundForPurchaseRequestError extends DomainError {
  constructor() {
    super('La sucursal indicada no existe o no pertenece a esta empresa');
  }
}

// RN-BRA-004: una sucursal inactiva no puede generar transacciones nuevas.
export class InactiveBranchForPurchaseRequestError extends DomainError {
  constructor() {
    super('No se puede crear una solicitud de compra bajo una sucursal inactiva');
  }
}

export class WarehouseNotFoundForPurchaseRequestError extends DomainError {
  constructor() {
    super('El almacén indicado no existe o no pertenece a la sucursal seleccionada');
  }
}

export class PurchaseRequestNotEditableError extends DomainError {
  constructor() {
    super('La solicitud solo puede editarse mientras está en borrador');
  }
}

export class InvalidPurchaseRequestStatusTransitionError extends DomainError {
  constructor(from, to) {
    super(`No se puede pasar la solicitud de "${from}" a "${to}"`);
  }
}

export class EmptyPurchaseRequestError extends DomainError {
  constructor() {
    super('La solicitud necesita al menos una línea de producto para enviarse');
  }
}
