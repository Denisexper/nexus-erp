export class ProductRepository {
  async findAll(_criteria) {
    throw new Error('ProductRepository.findAll no implementado');
  }

  async findById(_id) {
    throw new Error('ProductRepository.findById no implementado');
  }

  async findByInternalCode(_internalCode) {
    throw new Error('ProductRepository.findByInternalCode no implementado');
  }

  async findBySku(_sku) {
    throw new Error('ProductRepository.findBySku no implementado');
  }

  async create(_product) {
    throw new Error('ProductRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('ProductRepository.update no implementado');
  }
}
