import { UserNotFoundError } from '../../domain/errors.js';

export class ToggleUserStatusUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, companyId) {
    const user = await this.userRepository.findById(id, companyId);
    if (!user) throw new UserNotFoundError();

    return this.userRepository.update(id, { isActive: !user.isActive });
  }
}
