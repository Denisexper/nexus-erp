import {
  PurchaseRequestDetailNotFoundError,
  PurchaseRequestNotEditableForDetailError,
  ProductNotFoundForDetailError,
  UnitNotFoundForDetailError,
  InvalidPurchaseUnitError,
  InvalidQuantityError,
} from '../../domain/errors.js';
import { resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

export class UpdatePurchaseRequestDetailUseCase {
  constructor(purchaseRequestDetailRepository, purchaseRequestRepository, productRepository, unitRepository) {
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.productRepository = productRepository;
    this.unitRepository = unitRepository;
  }

  async execute(id, changes, companyId) {
    const requestIds = await resolvePurchaseRequestIdsForCompany(companyId, this.purchaseRequestRepository);
    const detail = await this.purchaseRequestDetailRepository.findById(id, requestIds);
    if (!detail) throw new PurchaseRequestDetailNotFoundError();

    const parent = await this.purchaseRequestRepository.findById(detail.purchaseRequest, companyId);
    if (!parent || parent.status !== 'draft') throw new PurchaseRequestNotEditableForDetailError();

    if (changes.quantity !== undefined && !(Number(changes.quantity) > 0)) throw new InvalidQuantityError();

    if (changes.product) {
      const productDoc = await this.productRepository.findById(changes.product, companyId);
      if (!productDoc) throw new ProductNotFoundForDetailError();
    }

    if (changes.unit) {
      const unitDoc = await this.unitRepository.findById(changes.unit, companyId);
      if (!unitDoc) throw new UnitNotFoundForDetailError();
      if (unitDoc.type !== 'purchase') throw new InvalidPurchaseUnitError();
    }

    return this.purchaseRequestDetailRepository.update(id, changes);
  }
}
