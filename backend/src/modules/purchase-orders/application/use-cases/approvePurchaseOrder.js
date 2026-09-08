import {
  PurchaseOrderNotFoundError,
  InvalidPurchaseOrderStatusTransitionError,
} from '../../domain/errors.js';

export class ApprovePurchaseOrderUseCase {
  constructor(purchaseOrderRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(id, companyId) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id, companyId);
    if (!purchaseOrder) throw new PurchaseOrderNotFoundError();

    if (purchaseOrder.status !== 'draft') {
      throw new InvalidPurchaseOrderStatusTransitionError(purchaseOrder.status, 'approved');
    }

    return this.purchaseOrderRepository.update(id, { status: 'approved' });
  }
}
