export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InventoryLotNotFoundForLabelError extends DomainError {
  constructor() {
    super('El lote de inventario indicado no existe');
  }
}

export class InvalidQuantityPrintedError extends DomainError {
  constructor() {
    super('La cantidad de etiquetas a imprimir debe ser mayor que cero');
  }
}

// RN-INV-017: toda reimpresión necesita un motivo explícito.
export class ReprintReasonRequiredError extends DomainError {
  constructor() {
    super('Debes indicar el motivo de la reimpresión');
  }
}
