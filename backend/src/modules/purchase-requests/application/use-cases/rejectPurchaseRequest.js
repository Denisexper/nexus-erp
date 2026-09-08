import {
  PurchaseRequestNotFoundError,
  InvalidPurchaseRequestStatusTransitionError,
} from '../../domain/errors.js';

export class RejectPurchaseRequestUseCase {
  constructor(purchaseRequestRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const purchaseRequest = await this.purchaseRequestRepository.findById(id, companyId);
    if (!purchaseRequest) throw new PurchaseRequestNotFoundError();

    if (purchaseRequest.status !== 'submitted') {
      throw new InvalidPurchaseRequestStatusTransitionError(purchaseRequest.status, 'rejected');
    }

    return this.purchaseRequestRepository.update(id, { status: 'rejected' });
  }
}
