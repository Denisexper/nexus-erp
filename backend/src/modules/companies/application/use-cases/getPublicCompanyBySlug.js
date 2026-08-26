import { CompanyNotFoundError } from '../../domain/errors.js';

export class GetPublicCompanyBySlugUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute(slug) {
    const company = await this.companyRepository.findPublicBySlug(slug);
    if (!company) throw new CompanyNotFoundError();
    return company;
  }
}
