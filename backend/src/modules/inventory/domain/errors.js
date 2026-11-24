export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidInventoryLotIdError extends DomainError {
  constructor() {
    super('Id de lote no válido');
  }
}

export class InventoryLotNotFoundError extends DomainError {
  constructor() {
    super('El lote de inventario no existe');
  }
}

export class InventoryLotNotPlaceableError extends DomainError {
  constructor() {
    super('Este lote ya no admite más ubicación (ya está colocado por completo o fue cancelado)');
  }
}

export class InvalidAssignQuantityError extends DomainError {
  constructor() {
    super('La cantidad a ubicar debe ser mayor que cero');
  }
}

export class AssignQuantityExceedsAvailableError extends DomainError {
  constructor() {
    super('La cantidad a ubicar supera lo que queda pendiente de este lote');
  }
}

export class LocationNotFoundForInventoryError extends DomainError {
  constructor() {
    super('La ubicación indicada no existe');
  }
}

export class InactiveLocationForInventoryError extends DomainError {
  constructor() {
    super('La ubicación indicada está inactiva');
  }
}

// Las ubicaciones tipo "vehículo" son solo un punto de tránsito para
// traslados (ERS 6.9.19) — no son un destino válido para la primera
// colocación de un lote recién recibido.
export class VehicleLocationNotValidForPlacementError extends DomainError {
  constructor() {
    super('No se puede ubicar mercancía directamente en una ubicación de tipo vehículo');
  }
}

export class InvalidAdjustmentQuantityError extends DomainError {
  constructor() {
    super('La cantidad del ajuste debe ser mayor que cero');
  }
}

// RN-INV-001: nunca existencias negativas.
export class InsufficientQuantityForAdjustmentError extends DomainError {
  constructor() {
    super('No hay suficiente existencia de ese lote en esa ubicación para registrar la salida');
  }
}

export class AdjustmentReasonRequiredError extends DomainError {
  constructor() {
    super('Debes indicar el motivo del ajuste');
  }
}
