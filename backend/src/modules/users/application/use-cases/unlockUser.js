import { UserNotFoundError } from '../../domain/errors.js';

// RN-005: permite a un admin levantar el bloqueo por intentos fallidos
// antes de que expiren los 5 minutos automáticos.
export class UnlockUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, companyId) {
    const user = await this.userRepository.findById(id, companyId);
    if (!user) throw new UserNotFoundError();

    return this.userRepository.update(id, { failedLoginAttempts: 0, lockedUntil: null });
  }
}
