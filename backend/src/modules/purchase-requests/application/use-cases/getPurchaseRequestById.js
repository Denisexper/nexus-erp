import { PurchaseRequestNotFoundError } from '../../domain/errors.js';

export class GetPurchaseRequestByIdUseCase {
  constructor(purchaseRequestRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const purchaseRequest = await this.purchaseRequestRepository.findById(id, companyId);
    if (!purchaseRequest) throw new PurchaseRequestNotFoundError();
    return purchaseRequest;
  }
}
