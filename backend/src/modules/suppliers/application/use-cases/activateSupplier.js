import { SupplierNotFoundError } from '../../domain/errors.js';

export class ActivateSupplierUseCase {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute(id, companyId) {
    const supplier = await this.supplierRepository.findById(id, companyId);
    if (!supplier) throw new SupplierNotFoundError();

    return this.supplierRepository.update(id, { isActive: true });
  }
}
