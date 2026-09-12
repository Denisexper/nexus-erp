export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class RetaceoNotFoundError extends DomainError {
  constructor() {
    super('Retaceo no encontrado');
  }
}

export class InvalidRetaceoIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseOrderNotFoundForRetaceoError extends DomainError {
  constructor() {
    super('La orden de compra indicada no existe');
  }
}

export class PurchaseOrderNotRetaceableError extends DomainError {
  constructor() {
    super('Solo se puede retacear una orden de compra aprobada');
  }
}

export class PurchaseOrderAlreadyRetaceadoError extends DomainError {
  constructor() {
    super('Esta orden de compra ya tiene un retaceo registrado');
  }
}

export class InvalidDaiAmountError extends DomainError {
  constructor() {
    super('El monto de DAI debe ser mayor o igual a cero');
  }
}

export class InvalidFreightAmountError extends DomainError {
  constructor() {
    super('El monto de flete debe ser mayor o igual a cero');
  }
}

export class InvalidRetaceoStatusTransitionError extends DomainError {
  constructor(from, to) {
    super(`No se puede pasar el retaceo de "${from}" a "${to}"`);
  }
}
