export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BranchNotFoundError extends DomainError {
  constructor() {
    super('Sucursal no encontrada');
  }
}

export class InvalidBranchIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class CompanyNotFoundForBranchError extends DomainError {
  constructor() {
    super('La empresa indicada no existe');
  }
}

// RN-EMP-005: una empresa inactiva no puede generar transacciones nuevas.
export class InactiveCompanyForBranchError extends DomainError {
  constructor() {
    super('No se puede crear una sucursal bajo una empresa inactiva');
  }
}

export class DuplicateBranchNameError extends DomainError {
  constructor() {
    super('Ya existe una sucursal con ese nombre en esta empresa');
  }
}

export class InvalidLocationError extends DomainError {
  constructor() {
    super('Departamento, municipio o distrito no válidos');
  }
}
