export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductImageNotFoundError extends DomainError {
  constructor() {
    super('Imagen no encontrada');
  }
}

export class InvalidProductImageIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class ProductNotFoundForImageError extends DomainError {
  constructor() {
    super('El producto asociado no existe');
  }
}

export class MissingImageFileError extends DomainError {
  constructor() {
    super('El archivo de imagen es obligatorio');
  }
}
