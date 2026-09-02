export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CompanyNotFoundError extends DomainError {
  constructor() {
    super('Empresa no encontrada');
  }
}

export class DuplicateSlugError extends DomainError {
  constructor() {
    super('Ya existe una empresa con ese slug');
  }
}

export class InvalidSlugError extends DomainError {
  constructor() {
    super('Slug no válido');
  }
}

export class DuplicateNitError extends DomainError {
  constructor() {
    super('Ya existe una empresa con ese NIT');
  }
}

export class DuplicateNrcError extends DomainError {
  constructor() {
    super('Ya existe una empresa con ese NRC');
  }
}

export class InvalidCompanyIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class InvalidLocationError extends DomainError {
  constructor() {
    super('Departamento, municipio o distrito no válidos');
  }
}
