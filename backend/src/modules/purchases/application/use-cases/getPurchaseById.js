import { PurchaseNotFoundError } from '../../domain/errors.js';

export class GetPurchaseByIdUseCase {
  constructor(purchaseRepository) {
    this.purchaseRepository = purchaseRepository;
  }

  async execute(id, companyId) {
    const purchase = await this.purchaseRepository.findById(id, companyId);
    if (!purchase) throw new PurchaseNotFoundError();
    return purchase;
  }
}
