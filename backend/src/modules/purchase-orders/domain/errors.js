export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PurchaseOrderNotFoundError extends DomainError {
  constructor() {
    super('Orden de compra no encontrada');
  }
}

export class InvalidPurchaseOrderIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class PurchaseQuotationNotFoundForOrderError extends DomainError {
  constructor() {
    super('La cotización indicada no existe');
  }
}

export class PurchaseQuotationNotSelectableError extends DomainError {
  constructor() {
    super('Solo se puede generar una orden a partir de una cotización recibida');
  }
}

export class BranchNotFoundForPurchaseOrderError extends DomainError {
  constructor() {
    super('La sucursal indicada no existe o no pertenece a esta empresa');
  }
}

export class WarehouseNotFoundForPurchaseOrderError extends DomainError {
  constructor() {
    super('El almacén indicado no existe o no pertenece a la sucursal seleccionada');
  }
}

export class ExpenseTypeNotFoundForOrderError extends DomainError {
  constructor() {
    super('El tipo de gasto indicado no existe');
  }
}

export class InvalidExpenseAmountError extends DomainError {
  constructor() {
    super('El monto del gasto debe ser mayor o igual a cero');
  }
}

export class PurchaseOrderNotEditableError extends DomainError {
  constructor() {
    super('La orden solo puede editarse mientras está en borrador');
  }
}

export class PurchaseOrderExpenseNotAddableError extends DomainError {
  constructor() {
    super('No se pueden registrar gastos en una orden cancelada o cerrada');
  }
}

export class InvalidPurchaseOrderStatusTransitionError extends DomainError {
  constructor(from, to) {
    super(`No se puede pasar la orden de "${from}" a "${to}"`);
  }
}
