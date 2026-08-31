import { Supplier } from '../../domain/Supplier.js';
import { CountryNotFoundForSupplierError, DuplicateSupplierCodeError } from '../../domain/errors.js';

export class CreateSupplierUseCase {
  constructor(supplierRepository, countryRepository) {
    this.supplierRepository = supplierRepository;
    this.countryRepository = countryRepository;
  }

  async execute(data) {
    const country = await this.countryRepository.findById(data.country);
    if (!country) throw new CountryNotFoundForSupplierError();

    // RN-SUP-002: el código interno del proveedor debe ser único (dentro de la empresa).
    const codeTaken = await this.supplierRepository.findByCodeAndCompany(data.code, data.company);
    if (codeTaken) throw new DuplicateSupplierCodeError();

    const supplier = new Supplier(data);
    return this.supplierRepository.create(supplier);
  }
}
