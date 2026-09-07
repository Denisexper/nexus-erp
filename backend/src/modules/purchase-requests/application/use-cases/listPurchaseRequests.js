export class ListPurchaseRequestsUseCase {
  constructor(purchaseRequestRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute({ search, companyId, status, branch, warehouse, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.purchaseRequestRepository.findAll({
      search,
      company: companyId,
      status,
      branch,
      warehouse,
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
