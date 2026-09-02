import { SupplierContactNotFoundError } from '../../domain/errors.js';
import { resolveSupplierIdsForCompany } from '#shared/lib/tenantScope.js';

export class ActivateSupplierContactUseCase {
  constructor(supplierContactRepository, supplierRepository) {
    this.supplierContactRepository = supplierContactRepository;
    this.supplierRepository = supplierRepository;
  }

  async execute(id, companyId) {
    const supplierIds = await resolveSupplierIdsForCompany(companyId, this.supplierRepository);
    const supplierContact = await this.supplierContactRepository.findById(id, supplierIds);
    if (!supplierContact) throw new SupplierContactNotFoundError();

    return this.supplierContactRepository.update(id, { isActive: true });
  }
}
