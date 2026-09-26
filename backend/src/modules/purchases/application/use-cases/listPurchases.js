export class ListPurchasesUseCase {
  constructor(purchaseRepository) {
    this.purchaseRepository = purchaseRepository;
  }

  async execute({ search, companyId, status, supplier, purchaseOrder, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.purchaseRepository.findAll({
      search,
      company: companyId,
      status,
      supplier,
      purchaseOrder,
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
