export class ListCompaniesUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute({ companyId, search, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.companyRepository.findAll({
      companyId,
      search,
      isActive,
      page: pageNum,
      limit: limitNum,
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
