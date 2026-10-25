import fs from 'node:fs/promises';
import path from 'node:path';
import { PurchaseQuotationDocumentNotFoundError, PurchaseQuotationNotFoundForDocumentError } from '../../domain/errors.js';

// No es una entidad de negocio con historial (RN-024 del ERS aplica a
// registros de negocio, no a un adjunto de evidencia): se borra físico, sin
// soft-delete, mismo criterio que purchase-order-expense-documents.
export class DeletePurchaseQuotationDocumentUseCase {
  constructor(purchaseQuotationDocumentRepository, purchaseQuotationRepository) {
    this.purchaseQuotationDocumentRepository = purchaseQuotationDocumentRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, companyId) {
    const document = await this.purchaseQuotationDocumentRepository.findById(id);
    if (!document) throw new PurchaseQuotationDocumentNotFoundError();

    const quotation = await this.purchaseQuotationRepository.findById(document.purchaseQuotation, companyId);
    if (!quotation) throw new PurchaseQuotationNotFoundForDocumentError();

    const deleted = await this.purchaseQuotationDocumentRepository.delete(id);

    const fullPath = path.join(process.cwd(), 'uploads', document.filePath);
    await fs.unlink(fullPath).catch(() => {});

    return deleted;
  }
}
