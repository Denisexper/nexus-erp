import { SupplierNotFoundError, CountryNotFoundForSupplierError, DuplicateSupplierCodeError } from '../../domain/errors.js';

export class UpdateSupplierUseCase {
  constructor(supplierRepository, countryRepository) {
    this.supplierRepository = supplierRepository;
    this.countryRepository = countryRepository;
  }

  async execute(id, changes, companyId) {
    const supplier = await this.supplierRepository.findById(id, companyId);
    if (!supplier) throw new SupplierNotFoundError();

    if (changes.code && changes.code !== supplier.code) {
      const codeTaken = await this.supplierRepository.findByCodeAndCompany(changes.code, companyId);
      if (codeTaken) throw new DuplicateSupplierCodeError();
    }

    if (changes.country) {
      const country = await this.countryRepository.findById(changes.country);
      if (!country) throw new CountryNotFoundForSupplierError();
    }

    return this.supplierRepository.update(id, changes);
  }
}
