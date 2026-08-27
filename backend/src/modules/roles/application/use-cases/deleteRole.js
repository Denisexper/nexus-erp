import { RoleNotFoundError, SystemRoleImmutableError, RoleInUseError } from '../../domain/errors.js';

export class DeleteRoleUseCase {
  /**
   * @param {import('../../domain/RoleRepository.js').RoleRepository} roleRepository
   * @param {(roleId: string) => Promise<number>} countUsersWithRole - cuántos usuarios tienen este rol asignado
   */
  constructor(roleRepository, countUsersWithRole) {
    this.roleRepository = roleRepository;
    this.countUsersWithRole = countUsersWithRole;
  }

  async execute(id, companyId) {
    const role = await this.roleRepository.findById(id, companyId);
    if (!role) throw new RoleNotFoundError();

    if (role.isSystem) throw new SystemRoleImmutableError();

    const usersWithRole = await this.countUsersWithRole(id);
    if (usersWithRole > 0) throw new RoleInUseError(usersWithRole);

    return this.roleRepository.remove(id);
  }
}
