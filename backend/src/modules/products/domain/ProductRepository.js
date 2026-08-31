export class ProductRepository {
  async findAll(_criteria) {
    throw new Error('ProductRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('ProductRepository.findById no implementado');
  }

  async findByInternalCodeAndCompany(_internalCode, _companyId) {
    throw new Error('ProductRepository.findByInternalCodeAndCompany no implementado');
  }

  async findBySkuAndCompany(_sku, _companyId) {
    throw new Error('ProductRepository.findBySkuAndCompany no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('ProductRepository.findIdsByCompany no implementado');
  }

  async create(_product) {
    throw new Error('ProductRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('ProductRepository.update no implementado');
  }
}
