export class ListSuppliersUseCase {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute({ search, companyId, country, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.supplierRepository.findAll({
      search,
      company: companyId,
      country,
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
