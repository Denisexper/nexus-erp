export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ExpenseTypeNotFoundError extends DomainError {
  constructor() {
    super('Tipo de gasto no encontrado');
  }
}

export class InvalidExpenseTypeIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class DuplicateExpenseTypeNameError extends DomainError {
  constructor() {
    super('Ya existe un tipo de gasto con ese nombre en esta empresa');
  }
}
