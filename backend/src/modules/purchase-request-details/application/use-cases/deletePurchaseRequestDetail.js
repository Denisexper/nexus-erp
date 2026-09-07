import {
  PurchaseRequestDetailNotFoundError,
  PurchaseRequestNotEditableForDetailError,
} from '../../domain/errors.js';
import { resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

export class DeletePurchaseRequestDetailUseCase {
  constructor(purchaseRequestDetailRepository, purchaseRequestRepository) {
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const requestIds = await resolvePurchaseRequestIdsForCompany(companyId, this.purchaseRequestRepository);
    const detail = await this.purchaseRequestDetailRepository.findById(id, requestIds);
    if (!detail) throw new PurchaseRequestDetailNotFoundError();

    const parent = await this.purchaseRequestRepository.findById(detail.purchaseRequest, companyId);
    if (!parent || parent.status !== 'draft') throw new PurchaseRequestNotEditableForDetailError();

    return this.purchaseRequestDetailRepository.delete(id);
  }
}
