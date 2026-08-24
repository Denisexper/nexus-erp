export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class LocationNotFoundError extends DomainError {
  constructor() {
    super('Ubicación no encontrada');
  }
}

export class InvalidLocationIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class WarehouseNotFoundForLocationError extends DomainError {
  constructor() {
    super('El almacén indicado no existe');
  }
}

export class DuplicateLocationCodeError extends DomainError {
  constructor() {
    super('Ya existe una ubicación con ese código en este almacén');
  }
}

export class InvalidCapacityError extends DomainError {
  constructor() {
    super('La capacidad debe ser mayor que cero');
  }
}

export class DuplicateLocationCoordinatesError extends DomainError {
  constructor() {
    super('Ya existe una ubicación con esa combinación de pasillo, estante, nivel y posición en este almacén');
  }
}

export class InvalidBatchRangeError extends DomainError {
  constructor() {
    super('El rango indicado no es válido: "desde" debe ser un entero menor o igual que "hasta"');
  }
}

export class BatchSizeExceededError extends DomainError {
  constructor(max, requested) {
    super(`El lote generaría ${requested} ubicaciones y el máximo permitido es ${max}. Reducí los rangos.`);
  }
}

export class LocationHasStockError extends DomainError {
  constructor() {
    super('No se puede desactivar la ubicación: todavía tiene existencias registradas en el kardex');
  }
}
