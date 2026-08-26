import { comparePassword } from '#shared/lib/password.js';
import { generateToken } from '#shared/lib/jwt.js';
import { InvalidCredentialsError, UserInactiveError, UserLockedError } from '../../domain/errors.js';

// RN-005: después de 5 intentos fallidos de autenticación, el usuario se
// bloquea 5 minutos (auto-expira, sin intervención de un admin).
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

export class LoginUseCase {
  constructor(userRepository, companyRepository, writeLogEntryUseCase) {
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
    this.writeLogEntryUseCase = writeLogEntryUseCase;
  }

  async execute({ slug, email, password }, { ipAddress, userAgent } = {}) {
    // No distinguimos "el slug no existe" de "password incorrecta": ambos
    // devuelven el mismo InvalidCredentialsError genérico, para no filtrar
    // qué empresas existen a través del propio login.
    const company = await this.companyRepository.findBySlug(slug);
    if (!company || !company.isActive) throw new InvalidCredentialsError();

    const user = await this.userRepository.findByEmailAndCompany(email, company.id);
    if (!user) throw new InvalidCredentialsError();

    if (!user.isActive) throw new UserInactiveError();

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UserLockedError(Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000));
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      const attempts = user.failedLoginAttempts + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await this.userRepository.update(user.id, { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) });
        throw new UserLockedError(LOCK_DURATION_MS / 1000);
      }

      await this.userRepository.update(user.id, { failedLoginAttempts: attempts });
      throw new InvalidCredentialsError();
    }

    const updated = await this.userRepository.update(user.id, { lastLogin: new Date(), failedLoginAttempts: 0, lockedUntil: null });

    const token = generateToken({
      id: updated.id,
      email: updated.email,
      roleId: updated.role?._id || updated.role,
      companyId: company.id,
    });

    // El log de login no debe tumbar el login si falla; solo se reporta.
    try {
      await this.writeLogEntryUseCase.execute({
        user: updated.id,
        action: 'login',
        resource: 'auth',
        entityId: updated.id,
        entityModel: 'userModel',
        entityName: updated.name,
        details: 'Login exitoso',
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error) {
      console.error('Error creating login log:', error);
    }

    return { token, user: updated };
  }
}
