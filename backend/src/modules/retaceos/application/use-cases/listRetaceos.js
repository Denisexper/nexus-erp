export class ListRetaceosUseCase {
  constructor(retaceoRepository) {
    this.retaceoRepository = retaceoRepository;
  }

  async execute({ search, companyId, status, supplier, purchase, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.retaceoRepository.findAll({
      search,
      company: companyId,
      status,
      supplier,
      purchase,
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
