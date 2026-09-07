import { PurchaseRequestDetail } from '../../domain/PurchaseRequestDetail.js';
import {
  PurchaseRequestNotFoundForDetailError,
  PurchaseRequestNotEditableForDetailError,
  ProductNotFoundForDetailError,
  UnitNotFoundForDetailError,
  InvalidPurchaseUnitError,
  InvalidQuantityError,
} from '../../domain/errors.js';

export class CreatePurchaseRequestDetailUseCase {
  constructor(purchaseRequestDetailRepository, purchaseRequestRepository, productRepository, unitRepository) {
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.productRepository = productRepository;
    this.unitRepository = unitRepository;
  }

  async execute({ purchaseRequest, product, quantity, unit, description, notes }, companyId) {
    const parent = await this.purchaseRequestRepository.findById(purchaseRequest, companyId);
    if (!parent) throw new PurchaseRequestNotFoundForDetailError();
    if (parent.status !== 'draft') throw new PurchaseRequestNotEditableForDetailError();

    if (!(Number(quantity) > 0)) throw new InvalidQuantityError();

    const productDoc = await this.productRepository.findById(product, companyId);
    if (!productDoc) throw new ProductNotFoundForDetailError();

    const unitDoc = await this.unitRepository.findById(unit, companyId);
    if (!unitDoc) throw new UnitNotFoundForDetailError();
    // RN-COM (units): documentos del lado compra solo admiten unidades type=purchase.
    if (unitDoc.type !== 'purchase') throw new InvalidPurchaseUnitError();

    const detail = new PurchaseRequestDetail({ purchaseRequest, product, quantity, unit, description, notes });
    return this.purchaseRequestDetailRepository.create(detail);
  }
}
