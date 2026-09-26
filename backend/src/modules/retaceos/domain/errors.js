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

export class PurchaseNotFoundForRetaceoError extends DomainError {
  constructor() {
    super('La compra indicada no existe');
  }
}

export class PurchaseNotRetaceableError extends DomainError {
  constructor() {
    super('Solo se puede retacear una compra recibida');
  }
}

export class PurchaseAlreadyRetaceadoError extends DomainError {
  constructor() {
    super('Esta compra ya tiene un retaceo registrado');
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
