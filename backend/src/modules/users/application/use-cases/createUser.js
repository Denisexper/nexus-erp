import { hashPassword } from '#shared/lib/password.js';
import { User } from '../../domain/User.js';
import { DuplicateEmailError, InactiveCompanyForUserError, InvalidRoleError } from '../../domain/errors.js';

/**
 * Caso de uso compartido por el registro público (módulo auth) y la creación
 * de usuarios por un admin (módulo users): ambos flujos son, en esencia,
 * "crear una cuenta con un rol válido".
 */
export class CreateUserUseCase {
  constructor(userRepository, roleRepository, companyRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.companyRepository = companyRepository;
  }

  async execute({ name, email, password, role, companyId }) {
    // El registro público (auth) todavía no asocia companyId a la cuenta, así
    // que el chequeo se salta en ese caso puntual en vez de romperlo más.
    if (companyId) {
      const company = await this.companyRepository.findById(companyId);
      if (company && !company.isActive) throw new InactiveCompanyForUserError();
    }

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
