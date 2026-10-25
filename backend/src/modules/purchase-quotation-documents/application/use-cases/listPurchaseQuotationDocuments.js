import { PurchaseQuotationNotFoundForDocumentError } from '../../domain/errors.js';

export class ListPurchaseQuotationDocumentsUseCase {
  constructor(purchaseQuotationDocumentRepository, purchaseQuotationRepository) {
    this.purchaseQuotationDocumentRepository = purchaseQuotationDocumentRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(purchaseQuotationId, companyId) {
    const quotation = await this.purchaseQuotationRepository.findById(purchaseQuotationId, companyId);
    if (!quotation) throw new PurchaseQuotationNotFoundForDocumentError();

    return this.purchaseQuotationDocumentRepository.findAllByQuotation(purchaseQuotationId);
  }
}
