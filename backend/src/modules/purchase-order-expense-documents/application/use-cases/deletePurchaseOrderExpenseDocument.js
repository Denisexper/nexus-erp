import fs from 'node:fs/promises';
import path from 'node:path';
import { PurchaseOrderExpenseDocumentNotFoundError, PurchaseOrderExpenseNotFoundForDocumentError } from '../../domain/errors.js';

// No es una entidad de negocio con historial (RN-024 del ERS aplica a
// registros de negocio, no a un adjunto de evidencia): se borra físico, sin
// soft-delete.
export class DeletePurchaseOrderExpenseDocumentUseCase {
  constructor(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository) {
    this.purchaseOrderExpenseDocumentRepository = purchaseOrderExpenseDocumentRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(id, companyId) {
    const document = await this.purchaseOrderExpenseDocumentRepository.findById(id);
    if (!document) throw new PurchaseOrderExpenseDocumentNotFoundError();

    const expense = await this.purchaseOrderRepository.findExpenseById(document.purchaseOrderExpense, companyId);
    if (!expense) throw new PurchaseOrderExpenseNotFoundForDocumentError();

    const deleted = await this.purchaseOrderExpenseDocumentRepository.delete(id);

    const fullPath = path.join(process.cwd(), 'uploads', document.filePath);
    await fs.unlink(fullPath).catch(() => {});

    return deleted;
  }
}
