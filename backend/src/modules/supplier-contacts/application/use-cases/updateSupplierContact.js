import { SupplierContactNotFoundError } from '../../domain/errors.js';
import { resolveSupplierIdsForCompany } from '#shared/lib/tenantScope.js';

export class UpdateSupplierContactUseCase {
  constructor(supplierContactRepository, supplierRepository) {
    this.supplierContactRepository = supplierContactRepository;
    this.supplierRepository = supplierRepository;
  }

  async execute(id, changes, companyId) {
    const supplierIds = await resolveSupplierIdsForCompany(companyId, this.supplierRepository);
    const supplierContact = await this.supplierContactRepository.findById(id, supplierIds);
    if (!supplierContact) throw new SupplierContactNotFoundError();

    return this.supplierContactRepository.update(id, changes);
  }
}
