import { PurchaseRequestDetailNotFoundError } from '../../domain/errors.js';
import { resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetPurchaseRequestDetailByIdUseCase {
  constructor(purchaseRequestDetailRepository, purchaseRequestRepository) {
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const requestIds = await resolvePurchaseRequestIdsForCompany(companyId, this.purchaseRequestRepository);
    const detail = await this.purchaseRequestDetailRepository.findById(id, requestIds);
    if (!detail) throw new PurchaseRequestDetailNotFoundError();
    return detail;
  }
}
