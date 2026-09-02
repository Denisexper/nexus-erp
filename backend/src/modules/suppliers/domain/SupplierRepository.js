export class SupplierRepository {
  async findAll(_criteria) {
    throw new Error('SupplierRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('SupplierRepository.findById no implementado');
  }

  async findByCodeAndCompany(_code, _companyId) {
    throw new Error('SupplierRepository.findByCodeAndCompany no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('SupplierRepository.findIdsByCompany no implementado');
  }

  async create(_supplier) {
    throw new Error('SupplierRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('SupplierRepository.update no implementado');
  }
}
