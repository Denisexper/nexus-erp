import { PurchaseOrderExpenseDocument } from '../../domain/PurchaseOrderExpenseDocument.js';
import { PurchaseOrderExpenseNotFoundForDocumentError, MissingExpenseDocumentFileError } from '../../domain/errors.js';

export class UploadPurchaseOrderExpenseDocumentUseCase {
  constructor(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository) {
    this.purchaseOrderExpenseDocumentRepository = purchaseOrderExpenseDocumentRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute({ purchaseOrderExpenseId, fileName, relativePath, fileType, companyId }) {
    if (!relativePath) throw new MissingExpenseDocumentFileError();

    // El gasto tiene que pertenecer a una orden de la company del usuario,
    // mismo chequeo que uploadProductImage.js hace contra el producto.
    const expense = await this.purchaseOrderRepository.findExpenseById(purchaseOrderExpenseId, companyId);
    if (!expense) throw new PurchaseOrderExpenseNotFoundForDocumentError();

    const document = new PurchaseOrderExpenseDocument({
      purchaseOrderExpense: purchaseOrderExpenseId,
      fileName,
      filePath: relativePath,
      fileType,
    });

    return this.purchaseOrderExpenseDocumentRepository.create(document);
  }
}
