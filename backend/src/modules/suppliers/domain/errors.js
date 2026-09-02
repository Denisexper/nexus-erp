export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SupplierNotFoundError extends DomainError {
  constructor() {
    super('Proveedor no encontrado');
  }
}

export class InvalidSupplierIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class CountryNotFoundForSupplierError extends DomainError {
  constructor() {
    super('El país indicado no existe');
  }
}

export class DuplicateSupplierCodeError extends DomainError {
  constructor() {
    super('Ya existe un proveedor con ese código en esta empresa');
  }
}
