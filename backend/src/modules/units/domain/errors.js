export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnitNotFoundError extends DomainError {
  constructor() {
    super('Unidad no encontrada');
  }
}

export class InvalidUnitIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class DuplicateUnitNameError extends DomainError {
  constructor() {
    super('Ya existe una unidad con ese nombre en esta empresa');
  }
}
