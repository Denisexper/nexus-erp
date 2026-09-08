import {
  PurchaseQuotationNotFoundError,
  InvalidPurchaseQuotationStatusTransitionError,
} from '../../domain/errors.js';

export class RejectPurchaseQuotationUseCase {
  constructor(purchaseQuotationRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, companyId) {
    const purchaseQuotation = await this.purchaseQuotationRepository.findById(id, companyId);
    if (!purchaseQuotation) throw new PurchaseQuotationNotFoundError();

    if (purchaseQuotation.status !== 'received') {
      throw new InvalidPurchaseQuotationStatusTransitionError(purchaseQuotation.status, 'rejected');
    }

    return this.purchaseQuotationRepository.update(id, { status: 'rejected' });
  }
}
