import { PurchaseRequestNotFoundForQuotationComparisonError } from '../../domain/errors.js';

export class GetPurchaseQuotationsComparisonUseCase {
  constructor(purchaseQuotationRepository, purchaseRequestRepository, purchaseRequestDetailRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
  }

  async execute(purchaseRequestIds, companyId) {
    const ids = Array.isArray(purchaseRequestIds) ? purchaseRequestIds : [purchaseRequestIds];

    const detailIds = [];
    for (const purchaseRequestId of ids) {
      const purchaseRequest = await this.purchaseRequestRepository.findById(purchaseRequestId, companyId);
      if (!purchaseRequest) throw new PurchaseRequestNotFoundForQuotationComparisonError();

      const { items: requestDetails } = await this.purchaseRequestDetailRepository.findAll({
        purchaseRequest: purchaseRequestId,
        limit: 1000,
      });
      detailIds.push(...requestDetails.map((detail) => detail.id));
    }

    return this.purchaseQuotationRepository.findComparisonForRequestDetailIds(detailIds, companyId);
  }
}
