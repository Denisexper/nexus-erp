import {
  PurchaseRequestNotFoundError,
  InvalidPurchaseRequestStatusTransitionError,
  EmptyPurchaseRequestError,
} from '../../domain/errors.js';

export class SubmitPurchaseRequestUseCase {
  constructor(purchaseRequestRepository, purchaseRequestDetailRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
  }

  async execute(id, companyId) {
    const purchaseRequest = await this.purchaseRequestRepository.findById(id, companyId);
    if (!purchaseRequest) throw new PurchaseRequestNotFoundError();

    if (purchaseRequest.status !== 'draft') {
      throw new InvalidPurchaseRequestStatusTransitionError(purchaseRequest.status, 'submitted');
    }

    const lineCount = await this.purchaseRequestDetailRepository.countByPurchaseRequest(id);
    if (lineCount === 0) throw new EmptyPurchaseRequestError();

    return this.purchaseRequestRepository.update(id, { status: 'submitted' });
  }
}
