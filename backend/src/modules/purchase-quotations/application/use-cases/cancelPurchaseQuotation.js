import {
  PurchaseQuotationNotFoundError,
  InvalidPurchaseQuotationStatusTransitionError,
} from '../../domain/errors.js';

// 'selected' no está en esta lista: una vez elegida para generar una orden
// (módulo purchase-orders, aún no construido), cancelarla es responsabilidad
// de ese módulo, no de este.
const CANCELLABLE_FROM = ['received', 'rejected'];

export class CancelPurchaseQuotationUseCase {
  constructor(purchaseQuotationRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, companyId) {
    const purchaseQuotation = await this.purchaseQuotationRepository.findById(id, companyId);
    if (!purchaseQuotation) throw new PurchaseQuotationNotFoundError();

    if (!CANCELLABLE_FROM.includes(purchaseQuotation.status)) {
      throw new InvalidPurchaseQuotationStatusTransitionError(purchaseQuotation.status, 'cancelled');
    }

    return this.purchaseQuotationRepository.update(id, { status: 'cancelled' });
  }
}
