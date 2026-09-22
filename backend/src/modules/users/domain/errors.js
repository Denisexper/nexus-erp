export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuario no encontrado');
  }
}

export class DuplicateEmailError extends DomainError {
  constructor() {
    super('El email ya está en uso');
  }
}

// RN-EMP-005: una empresa inactiva no puede generar transacciones nuevas.
export class InactiveCompanyForUserError extends DomainError {
  constructor() {
    super('No se puede crear un usuario bajo una empresa inactiva');
  }
}

export class InvalidUserIdError extends DomainError {
  constructor() {
    super('Id no válido');
  }
}

export class InvalidRoleError extends DomainError {
  constructor() {
    super('Rol no válido');
  }
}

export class WeakPasswordError extends DomainError {
  constructor() {
    super('La contraseña debe tener al menos 6 caracteres');
  }
}

export class ForbiddenRoleChangeError extends DomainError {
  constructor() {
    super('No tienes permiso para cambiar roles');
  }
}

export class ForbiddenUserDeletionError extends DomainError {
  constructor() {
    super('No tienes permisos para eliminar usuarios');
  }
}

export class CannotDeleteSelfError extends DomainError {
  constructor() {
    super('No puedes eliminar tu propia cuenta');
  }
}
