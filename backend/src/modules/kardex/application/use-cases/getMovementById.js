import { MovementNotFoundError } from '../../domain/errors.js';

export class GetMovementByIdUseCase {
  constructor(kardexRepository) {
    this.kardexRepository = kardexRepository;
  }

  async execute(id) {
    const movement = await this.kardexRepository.findById(id);
    if (!movement) throw new MovementNotFoundError();
    return movement;
  }
}
