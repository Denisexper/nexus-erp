import { UnitNotFoundError, DuplicateUnitNameError } from '../../domain/errors.js';

export class UpdateUnitUseCase {
  constructor(unitRepository) {
    this.unitRepository = unitRepository;
  }

  async execute(id, changes, companyId) {
    const unit = await this.unitRepository.findById(id, companyId);
    if (!unit) throw new UnitNotFoundError();

    if (changes.name && changes.name !== unit.name) {
      const nameTaken = await this.unitRepository.findByNameAndCompany(changes.name, companyId);
      if (nameTaken) throw new DuplicateUnitNameError();
    }

    return this.unitRepository.update(id, changes);
  }
}
