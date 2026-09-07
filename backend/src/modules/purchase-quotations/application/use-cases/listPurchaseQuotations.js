export class ListPurchaseQuotationsUseCase {
  constructor(purchaseQuotationRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute({ search, companyId, status, supplier, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.purchaseQuotationRepository.findAll({
      search,
      company: companyId,
      status,
      supplier,
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
