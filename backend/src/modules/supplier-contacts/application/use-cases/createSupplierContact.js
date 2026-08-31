import { SupplierContact } from '../../domain/SupplierContact.js';
import { SupplierNotFoundForSupplierContactError } from '../../domain/errors.js';

export class CreateSupplierContactUseCase {
  constructor(supplierContactRepository, supplierRepository) {
    this.supplierContactRepository = supplierContactRepository;
    this.supplierRepository = supplierRepository;
  }

  async execute(data, companyId) {
    const supplier = await this.supplierRepository.findById(data.supplier, companyId);
    if (!supplier) throw new SupplierNotFoundForSupplierContactError();

    const supplierContact = new SupplierContact(data);
    return this.supplierContactRepository.create(supplierContact);
  }
}
