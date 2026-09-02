import { RoleNotFoundError, SystemRoleNameImmutableError } from '../../domain/errors.js';

export class UpdateRoleUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(id, changes, companyId) {
    const role = await this.roleRepository.findById(id, companyId);
    if (!role) throw new RoleNotFoundError();

    // No se permite renombrar roles del sistema (admin, moderator, user).
    if (role.isSystem && changes.name !== undefined) {
      throw new SystemRoleNameImmutableError();
    }

    // El nombre de un rol nunca se actualiza por este caso de uso, solo se
    // usa arriba para la validación de roles del sistema.
    const { name, ...allowedChanges } = changes;
    return this.roleRepository.update(id, allowedChanges);
  }
}
