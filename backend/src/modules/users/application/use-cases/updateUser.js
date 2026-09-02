import { hashPassword } from '#shared/lib/password.js';
import { UserNotFoundError, DuplicateEmailError, WeakPasswordError, ForbiddenRoleChangeError, InvalidRoleError } from '../../domain/errors.js';

export class UpdateUserUseCase {
  constructor(userRepository, roleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  async execute(id, { name, email, password, role }, { actingUserRole, companyId } = {}) {
    const user = await this.userRepository.findById(id, companyId);
    if (!user) throw new UserNotFoundError();

    if (email && email !== user.email) {
      const emailTaken = await this.userRepository.findByEmailAndCompany(email, user.company);
      if (emailTaken) throw new DuplicateEmailError();
    }

    const changes = {};
    if (name) changes.name = name;
    if (email) changes.email = email;

    if (password) {
      if (password.length < 6) throw new WeakPasswordError();
      changes.password = await hashPassword(password);
    }

    // Solo un admin puede reasignar el rol de otro usuario, y el rol nuevo
    // tiene que pertenecer a la misma company que el usuario (si no, un admin
    // podría asignarle a su gente el rol de otro tenant).
    if (role) {
      if (actingUserRole !== 'admin') throw new ForbiddenRoleChangeError();
      const roleDoc = await this.roleRepository.findById(role, user.company);
      if (!roleDoc) throw new InvalidRoleError();
      changes.role = role;
    }

    return this.userRepository.update(id, changes);
  }
}
