export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseOrderExpenseDocumentNotFoundError extends DomainError {
  constructor() {
    super('Documento no encontrado');
  }
}

export class InvalidPurchaseOrderExpenseDocumentIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseOrderExpenseNotFoundForDocumentError extends DomainError {
  constructor() {
    super('El gasto asociado no existe');
  }
}

export class MissingExpenseDocumentFileError extends DomainError {
  constructor() {
    super('El archivo es obligatorio');
  }
}
