import { PurchaseOrderNotFoundError } from '../../domain/errors.js';

// CU-087: navegar de una orden hacia su cotización y de ahí hacia las
// solicitudes originales (ERS 6.8.28).
export class GetPurchaseOrderTraceabilityUseCase {
  constructor(purchaseOrderRepository, purchaseQuotationRepository, purchaseRequestRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(id, companyId) {
    const order = await this.purchaseOrderRepository.findById(id, companyId);
    if (!order) throw new PurchaseOrderNotFoundError();

    const quotationId = order.purchaseQuotation?._id || order.purchaseQuotation;
    const quotation = await this.purchaseQuotationRepository.findById(quotationId, companyId);

    const requestIds = quotation
      ? await this.purchaseQuotationRepository.findRequestIdsForQuotation(quotation.id)
      : [];

    const requests = [];
    for (const requestId of requestIds) {
      const request = await this.purchaseRequestRepository.findById(requestId, companyId);
      if (request) requests.push(request);
    }

    return { order, quotation, requests };
  }
}
