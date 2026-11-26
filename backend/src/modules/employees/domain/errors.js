export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmployeeNotFoundError extends DomainError {
  constructor() {
    super('Empleado no encontrado');
  }
}

export class InvalidEmployeeIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class BranchNotFoundForEmployeeError extends DomainError {
  constructor() {
    super('La sucursal indicada no existe');
  }
}

// Mismo criterio que warehouses/locations: no se puede dar de alta personal
// nuevo colgado de una sucursal inactiva.
export class InactiveBranchForEmployeeError extends DomainError {
  constructor() {
    super('No se puede crear un empleado bajo una sucursal inactiva');
  }
}

export class DuplicateEmployeeDuiError extends DomainError {
  constructor() {
    super('Ya existe un empleado registrado con ese DUI');
  }
}

export class InvalidDuiError extends DomainError {
  constructor() {
    super('El DUI no tiene un formato válido (########-#)');
  }
}
