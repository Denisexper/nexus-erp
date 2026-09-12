import { RetaceoNotFoundError } from '../../domain/errors.js';

export class GetRetaceoByIdUseCase {
  constructor(retaceoRepository) {
    this.retaceoRepository = retaceoRepository;
  }

  async execute(id, companyId) {
    const retaceo = await this.retaceoRepository.findById(id, companyId);
    if (!retaceo) throw new RetaceoNotFoundError();
    return retaceo;
  }
}
