export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidKardexIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class MovementNotFoundError extends DomainError {
  constructor() {
    super('Movimiento no encontrado');
  }
}

export class ProductNotFoundForKardexError extends DomainError {
  constructor() {
    super('El producto indicado no existe');
  }
}

export class LocationNotFoundForKardexError extends DomainError {
  constructor() {
    super('La ubicación indicada no existe');
  }
}

// Por consistencia con RN-EMP-005/RN-BRA-004: una ubicación inactiva nunca
// tiene existencias (RN-WHS-007 impide desactivarla si tiene stock), así que
// bloquear movimientos ahí no deja inventario sin forma de moverse.
export class InactiveLocationForKardexError extends DomainError {
  constructor() {
    super('No se puede registrar un movimiento en una ubicación inactiva');
  }
}

export class InvalidQuantityError extends DomainError {
  constructor() {
    super('La cantidad debe ser mayor que cero');
  }
}

export class InsufficientStockError extends DomainError {
  constructor() {
    super('No hay suficiente existencia en esa ubicación para registrar la salida');
  }
}

export class SameLocationTransferError extends DomainError {
  constructor() {
    super('La ubicación de origen y destino no pueden ser la misma');
  }
}
