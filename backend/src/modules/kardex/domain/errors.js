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
