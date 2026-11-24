export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidInventoryTransferIdError extends DomainError {
  constructor() {
    super('Id de traslado no válido');
  }
}

export class InventoryTransferNotFoundError extends DomainError {
  constructor() {
    super('El traslado no existe');
  }
}

export class SourceWarehouseNotFoundError extends DomainError {
  constructor() {
    super('El almacén de origen indicado no existe');
  }
}

export class DestinationWarehouseNotFoundError extends DomainError {
  constructor() {
    super('El almacén de destino indicado no existe');
  }
}

export class EmptyTransferError extends DomainError {
  constructor() {
    super('El traslado necesita al menos una línea de producto');
  }
}

export class InventoryLotNotFoundForTransferError extends DomainError {
  constructor() {
    super('Uno de los lotes indicados no existe');
  }
}

// ERS 6.9.19: la mercancía en tránsito se asocia a una ubicación tipo
// vehículo. Se exige siempre en esta fase (sin el atajo de traslado directo
// entre ubicaciones de un mismo almacén, que queda fuera de alcance).
export class VehicleLocationRequiredError extends DomainError {
  constructor() {
    super('Debes indicar la ubicación tipo vehículo que transportará la mercancía');
  }
}

export class InvalidVehicleLocationError extends DomainError {
  constructor() {
    super('La ubicación indicada como vehículo no existe o no es de tipo vehículo');
  }
}

export class SourceLocationNotFoundError extends DomainError {
  constructor() {
    super('Una de las ubicaciones de origen no existe o no pertenece al almacén de origen');
  }
}

export class DestinationLocationNotFoundError extends DomainError {
  constructor() {
    super('Una de las ubicaciones de destino no existe o no pertenece al almacén de destino');
  }
}

export class DestinationLocationCannotBeVehicleError extends DomainError {
  constructor() {
    super('La ubicación de destino no puede ser de tipo vehículo');
  }
}

export class InvalidTransferQuantityError extends DomainError {
  constructor() {
    super('La cantidad a trasladar debe ser mayor que cero');
  }
}

export class InsufficientQuantityAtSourceError extends DomainError {
  constructor() {
    super('No hay suficiente existencia de ese lote en la ubicación de origen');
  }
}

export class InvalidTransferStatusTransitionError extends DomainError {
  constructor(from, to) {
    super(`No se puede pasar el traslado de "${from}" a "${to}"`);
  }
}

export class InvalidReceivedQuantityError extends DomainError {
  constructor() {
    super('La cantidad recibida no puede ser mayor que la despachada ni menor que cero');
  }
}
