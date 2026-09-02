import { hashPassword } from '#shared/lib/password.js';
import { User } from '../../domain/User.js';
import { DuplicateEmailError, InvalidRoleError } from '../../domain/errors.js';

/**
 * Caso de uso compartido por el registro público (módulo auth) y la creación
 * de usuarios por un admin (módulo users): ambos flujos son, en esencia,
 * "crear una cuenta con un rol válido".
 */
export class CreateUserUseCase {
  constructor(userRepository, roleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  async execute({ name, email, password, role, companyId }) {
    const existing = await this.userRepository.findByEmailAndCompany(email, companyId);
    if (existing) throw new DuplicateEmailError();

    const roleDoc = await this.roleRepository.findByIdOrName(role || 'user', companyId);
    if (!roleDoc) throw new InvalidRoleError();

    const passwordHash = await hashPassword(password);
    const user = new User({ name, email, password: passwordHash, role: roleDoc.id, company: companyId });
    const created = await this.userRepository.create(user);

    return { user: created, role: roleDoc };
  }
}
