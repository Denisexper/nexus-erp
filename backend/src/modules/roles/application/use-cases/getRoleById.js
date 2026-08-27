import { RoleNotFoundError } from '../../domain/errors.js';

export class GetRoleByIdUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(id, companyId) {
    const role = await this.roleRepository.findById(id, companyId);
    if (!role) throw new RoleNotFoundError();
    return role;
  }
}
