export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CategoryNotFoundError extends DomainError {
  constructor() {
    super('Categoría no encontrada');
  }
}

export class InvalidCategoryIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class DuplicateCategoryNameError extends DomainError {
  constructor() {
    super('Ya existe una categoría con ese nombre en esta empresa');
  }
}
