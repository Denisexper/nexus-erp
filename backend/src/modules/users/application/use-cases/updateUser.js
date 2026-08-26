import { hashPassword } from '#shared/lib/password.js';
import { UserNotFoundError, DuplicateEmailError, WeakPasswordError, ForbiddenRoleChangeError } from '../../domain/errors.js';

export class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, { name, email, password, role }, { actingUserRole } = {}) {
    const user = await this.userRepository.findById(id);
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

    // Solo un admin puede reasignar el rol de otro usuario.
    if (role) {
      if (actingUserRole !== 'admin') throw new ForbiddenRoleChangeError();
      changes.role = role;
    }

    return this.userRepository.update(id, changes);
  }
}
