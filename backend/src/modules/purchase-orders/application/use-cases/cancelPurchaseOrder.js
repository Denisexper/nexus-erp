import {
  PurchaseOrderNotFoundError,
  InvalidPurchaseOrderStatusTransitionError,
} from '../../domain/errors.js';

const CANCELLABLE_FROM = ['draft', 'approved'];

// Al cancelar la orden, la cotización de origen vuelve de 'selected' a
// 'received' — queda disponible de nuevo para generar otra orden (comentario
// en purchase-quotations/cancelPurchaseQuotation.js: "cancelarla es
// responsabilidad de ese módulo"). El status de las solicitudes de origen
// (partially_ordered/completed) no se revierte: mismo criterio de "nunca
// retroceder" que ya rige el avance por cotización.
export class CancelPurchaseOrderUseCase {
  constructor(purchaseOrderRepository, purchaseQuotationRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, companyId) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id, companyId);
    if (!purchaseOrder) throw new PurchaseOrderNotFoundError();

    if (!CANCELLABLE_FROM.includes(purchaseOrder.status)) {
      throw new InvalidPurchaseOrderStatusTransitionError(purchaseOrder.status, 'cancelled');
    }

    const cancelled = await this.purchaseOrderRepository.update(id, { status: 'cancelled' });

    const quotationId = purchaseOrder.purchaseQuotation?._id || purchaseOrder.purchaseQuotation;
    const quotation = await this.purchaseQuotationRepository.findById(quotationId, companyId);
    if (quotation && quotation.status === 'selected') {
      await this.purchaseQuotationRepository.update(quotationId, { status: 'received' });
    }

    return cancelled;
  }
}
