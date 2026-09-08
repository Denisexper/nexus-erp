import { PurchaseOrderNotFoundError } from '../../domain/errors.js';

export class GetPurchaseOrderByIdUseCase {
  constructor(purchaseOrderRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(id, companyId) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id, companyId);
    if (!purchaseOrder) throw new PurchaseOrderNotFoundError();
    return purchaseOrder;
  }
}
