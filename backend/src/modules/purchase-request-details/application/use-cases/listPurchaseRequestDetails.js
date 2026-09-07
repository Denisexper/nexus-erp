import { NO_MATCH_ID, resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListPurchaseRequestDetailsUseCase {
  constructor(purchaseRequestDetailRepository, purchaseRequestRepository) {
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute({ companyId, purchaseRequest, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let purchaseRequestFilter = purchaseRequest;
    if (companyId) {
      const companyRequestIds = await resolvePurchaseRequestIdsForCompany(companyId, this.purchaseRequestRepository);
      purchaseRequestFilter = purchaseRequest
        ? (companyRequestIds.includes(purchaseRequest) ? purchaseRequest : NO_MATCH_ID)
        : { $in: companyRequestIds };
    }

    const { items, total } = await this.purchaseRequestDetailRepository.findAll({
      purchaseRequest: purchaseRequestFilter,
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
