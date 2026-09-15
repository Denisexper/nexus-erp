import { PurchaseOrderExpenseNotFoundForDocumentError } from '../../domain/errors.js';

export class ListPurchaseOrderExpenseDocumentsUseCase {
  constructor(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository) {
    this.purchaseOrderExpenseDocumentRepository = purchaseOrderExpenseDocumentRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(purchaseOrderExpenseId, companyId) {
    const expense = await this.purchaseOrderRepository.findExpenseById(purchaseOrderExpenseId, companyId);
    if (!expense) throw new PurchaseOrderExpenseNotFoundForDocumentError();

    return this.purchaseOrderExpenseDocumentRepository.findAllByExpense(purchaseOrderExpenseId);
  }
}
