import { PurchaseQuotationDocument } from '../../domain/PurchaseQuotationDocument.js';
import { PurchaseQuotationNotFoundForDocumentError, MissingQuotationDocumentFileError } from '../../domain/errors.js';

export class UploadPurchaseQuotationDocumentUseCase {
  constructor(purchaseQuotationDocumentRepository, purchaseQuotationRepository) {
    this.purchaseQuotationDocumentRepository = purchaseQuotationDocumentRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute({ purchaseQuotationId, fileName, relativePath, fileType, companyId }) {
    if (!relativePath) throw new MissingQuotationDocumentFileError();

    // PurchaseQuotation tiene company propio: no hace falta el salto
    // indirecto que usa purchase-order-expense-documents con purchaseOrder.
    const quotation = await this.purchaseQuotationRepository.findById(purchaseQuotationId, companyId);
    if (!quotation) throw new PurchaseQuotationNotFoundForDocumentError();

    const document = new PurchaseQuotationDocument({
      purchaseQuotation: purchaseQuotationId,
      fileName,
      filePath: relativePath,
      fileType,
    });

    return this.purchaseQuotationDocumentRepository.create(document);
  }
}
