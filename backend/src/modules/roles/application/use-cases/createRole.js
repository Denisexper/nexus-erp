import { Role } from '../../domain/Role.js';
import { DuplicateRoleNameError } from '../../domain/errors.js';

export class CreateRoleUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(data) {
    const name = data.name?.toLowerCase();
    const existing = await this.roleRepository.findByName(name, data.company);
    if (existing) throw new DuplicateRoleNameError();

    const role = new Role({ ...data, name, isSystem: false });
    return this.roleRepository.create(role);
  }
}
