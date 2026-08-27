import { CompanyNotFoundError } from '../../domain/errors.js';

export class DeactivateCompanyUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute(id, companyId) {
    const company = await this.companyRepository.findById(id, companyId);
    if (!company) throw new CompanyNotFoundError();

    return this.companyRepository.update(id, { isActive: false });
  }
}
