export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseQuotationDocumentNotFoundError extends DomainError {
  constructor() {
    super('Documento no encontrado');
  }
}

export class InvalidPurchaseQuotationDocumentIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseQuotationNotFoundForDocumentError extends DomainError {
  constructor() {
    super('La cotización asociada no existe');
  }
}

export class MissingQuotationDocumentFileError extends DomainError {
  constructor() {
    super('El archivo es obligatorio');
  }
}
