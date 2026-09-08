import { PurchaseQuotationNotFoundError } from '../../domain/errors.js';

export class GetPurchaseQuotationByIdUseCase {
  constructor(purchaseQuotationRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, companyId) {
    const purchaseQuotation = await this.purchaseQuotationRepository.findById(id, companyId);
    if (!purchaseQuotation) throw new PurchaseQuotationNotFoundError();
    return purchaseQuotation;
  }
}
