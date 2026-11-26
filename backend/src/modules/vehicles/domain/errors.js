export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class VehicleNotFoundError extends DomainError {
  constructor() {
    super('Vehículo no encontrado');
  }
}

export class InvalidVehicleIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class EmployeeNotFoundForVehicleError extends DomainError {
  constructor() {
    super('El empleado responsable indicado no existe');
  }
}

// El conductor asignado a un vehículo debe estar activo; no tendría sentido
// asignar uno de baja a un vehículo nuevo o a un cambio de responsable.
export class InactiveEmployeeForVehicleError extends DomainError {
  constructor() {
    super('El empleado indicado como responsable está inactivo');
  }
}

export class DuplicateVehiclePlateError extends DomainError {
  constructor() {
    super('Ya existe un vehículo registrado con esa placa');
  }
}

export class InvalidVehicleYearError extends DomainError {
  constructor() {
    super('El año del vehículo no es válido');
  }
}
