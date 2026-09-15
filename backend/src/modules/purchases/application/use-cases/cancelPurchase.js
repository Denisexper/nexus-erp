import { PurchaseNotFoundError, PurchaseNotCancellableError } from '../../domain/errors.js';

// Solo se puede cancelar una compra recién registrada (sin retaceo hecho
// sobre ella todavía) — evitamos acoplar este módulo al de retaceos acá; si
// ya existe un retaceo, cancelarlo primero es responsabilidad de ese módulo.
export class CancelPurchaseUseCase {
  constructor(purchaseRepository, purchaseOrderRepository) {
    this.purchaseRepository = purchaseRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(id, companyId) {
    const purchase = await this.purchaseRepository.findById(id, companyId);
    if (!purchase) throw new PurchaseNotFoundError();
    if (purchase.status !== 'received') throw new PurchaseNotCancellableError();

    const cancelled = await this.purchaseRepository.update(id, { status: 'cancelled' });

    const orderId = purchase.purchaseOrder?._id || purchase.purchaseOrder;
    const order = await this.purchaseOrderRepository.findById(orderId, companyId);
    if (order) {
      const receivedByDetail = await this.purchaseRepository.getReceivedQuantitiesByOrder(order.id);
      const hasAnyReceipt = Object.values(receivedByDetail).some((qty) => qty > 0);
      const isFullyReceived = order.details.every((d) => (receivedByDetail[d.id] || 0) + 0.0001 >= d.quantity);

      const newStatus = isFullyReceived ? 'received' : hasAnyReceipt ? 'partially_received' : 'approved';
      if (order.status !== newStatus) {
        await this.purchaseOrderRepository.update(order.id, { status: newStatus });
      }
    }

    return cancelled;
  }
}
