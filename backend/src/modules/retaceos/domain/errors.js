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

// ERS 6.9: una vez que un lote de inventario fue asignado a una ubicación ya
// generó movimientos inmutables (RN-INV-007) y alimentó el costo promedio con
// el costo pre-retaceo — corregirlo ahí requeriría tocar ese histórico, fuera
// de alcance. Por eso el retaceo solo puede crearse mientras todos los lotes
// de la compra siguen 'pending_placement'.
export class RetaceoNotApplicableAfterLocationAssignmentError extends DomainError {
  constructor() {
    super('No se puede registrar el retaceo: ya se asignó a ubicación mercancía de esta compra con el costo anterior');
  }
}
