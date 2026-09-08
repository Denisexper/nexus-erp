import {
  PurchaseRequestNotFoundError,
  InvalidPurchaseRequestStatusTransitionError,
} from '../../domain/errors.js';

const CANCELLABLE_FROM = ['draft', 'submitted', 'approved'];

export class CancelPurchaseRequestUseCase {
  constructor(purchaseRequestRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const purchaseRequest = await this.purchaseRequestRepository.findById(id, companyId);
    if (!purchaseRequest) throw new PurchaseRequestNotFoundError();

    if (!CANCELLABLE_FROM.includes(purchaseRequest.status)) {
      throw new InvalidPurchaseRequestStatusTransitionError(purchaseRequest.status, 'cancelled');
    }

    return this.purchaseRequestRepository.update(id, { status: 'cancelled' });
  }
}
