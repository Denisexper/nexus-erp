import { EmptyConsolidatedPdfRequestIdsError, NoPurchaseRequestsFoundForPdfError } from '../../domain/errors.js';
import { resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

// Agrupa por producto+unidad, mismo criterio que PurchaseRequestConsolidatedModal.jsx
// en el frontend (fetchLinesForRequests) — se duplica acá porque el PDF se genera
// en el servidor y no hay forma de reusar código de SolidJS sin acoplar capas.
export class GenerateConsolidatedPurchaseRequestPdfUseCase {
  constructor(purchaseRequestRepository, purchaseRequestDetailRepository, companyRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.companyRepository = companyRepository;
  }

  async execute(purchaseRequestIds, companyId) {
    if (!Array.isArray(purchaseRequestIds) || purchaseRequestIds.length === 0) {
      throw new EmptyConsolidatedPdfRequestIdsError();
    }

    // Igual criterio que createPurchaseQuotation con resolvePurchaseRequestIdsForCompany:
    // los ids que no pertenecen a la company del usuario se descartan en silencio,
    // en vez de filtrar, para no filtrar datos de otro tenant.
    const allowedIds = await resolvePurchaseRequestIdsForCompany(companyId, this.purchaseRequestRepository);
    const allowedSet = new Set((allowedIds || []).map(String));
    const scopedIds = purchaseRequestIds.filter((id) => allowedSet.has(String(id)));
    if (scopedIds.length === 0) throw new NoPurchaseRequestsFoundForPdfError();

    const requests = [];
    for (const id of scopedIds) {
      const request = await this.purchaseRequestRepository.findById(id, companyId);
      if (request) requests.push(request);
    }
    if (requests.length === 0) throw new NoPurchaseRequestsFoundForPdfError();

    const byKey = new Map();
    for (const request of requests) {
      const { items: lines } = await this.purchaseRequestDetailRepository.findAll({ purchaseRequest: request.id, limit: 1000 });
      for (const line of lines) {
        const productId = line.product?._id || line.product;
        const unitId = line.unit?._id || line.unit;
        const key = `${productId}__${unitId}`;

        if (!byKey.has(key)) {
          byKey.set(key, {
            productName: line.product?.name || '-',
            unitName: line.unit?.name || '-',
            totalQuantity: 0,
            breakdown: [],
          });
        }

        const entry = byKey.get(key);
        entry.totalQuantity += Number(line.quantity || 0);
        entry.breakdown.push({ requestCode: request.code, quantity: line.quantity });
      }
    }

    const lines = Array.from(byKey.values()).sort((a, b) => a.productName.localeCompare(b.productName));
    const company = await this.companyRepository.findById(companyId);

    return {
      lines,
      meta: {
        companyName: company?.name || '-',
        requestCodes: requests.map((r) => r.code),
        generatedAt: new Date(),
      },
    };
  }
}
