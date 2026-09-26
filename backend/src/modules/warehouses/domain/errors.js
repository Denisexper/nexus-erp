export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WarehouseNotFoundError extends DomainError {
  constructor() {
    super('Almacén no encontrado');
  }
}

export class InvalidWarehouseIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class BranchNotFoundForWarehouseError extends DomainError {
  constructor() {
    super('La sucursal indicada no existe');
  }
}

// RN-BRA-004: una sucursal inactiva no puede generar transacciones nuevas.
export class InactiveBranchForWarehouseError extends DomainError {
  constructor() {
    super('No se puede crear un almacén bajo una sucursal inactiva');
  }
}

export class WarehouseCategoryNotFoundForWarehouseError extends DomainError {
  constructor() {
    super('La categoría de almacén indicada no existe');
  }
}

export class DuplicateWarehouseNameError extends DomainError {
  constructor() {
    super('Ya existe un almacén con ese nombre en esta sucursal');
  }
}
