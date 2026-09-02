export class SearchPublicCompaniesUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute({ search, limit }) {
    return this.companyRepository.searchPublic({ search, limit });
  }
}
