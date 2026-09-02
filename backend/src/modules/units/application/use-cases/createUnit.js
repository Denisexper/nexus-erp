import { Unit } from '../../domain/Unit.js';
import { DuplicateUnitNameError } from '../../domain/errors.js';

export class CreateUnitUseCase {
  constructor(unitRepository) {
    this.unitRepository = unitRepository;
  }

  async execute({ name, type, company }) {
    const existing = await this.unitRepository.findByNameAndCompany(name, company);
    if (existing) throw new DuplicateUnitNameError();

    const unit = new Unit({ name, type, company });
    return this.unitRepository.create(unit);
  }
}
