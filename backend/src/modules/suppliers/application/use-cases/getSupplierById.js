import { SupplierNotFoundError } from '../../domain/errors.js';

export class GetSupplierByIdUseCase {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute(id, companyId) {
    const supplier = await this.supplierRepository.findById(id, companyId);
    if (!supplier) throw new SupplierNotFoundError();
    return supplier;
  }
}
