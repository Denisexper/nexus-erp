export class ListExpenseTypesUseCase {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute({ search, companyId, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.expenseTypeRepository.findAll({
      search,
      company: companyId,
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
