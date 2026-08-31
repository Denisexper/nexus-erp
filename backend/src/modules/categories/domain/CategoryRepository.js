export class CategoryRepository {
  async findAll(_criteria) {
    throw new Error('CategoryRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('CategoryRepository.findById no implementado');
  }

  async findByNameAndCompany(_name, _companyId) {
    throw new Error('CategoryRepository.findByNameAndCompany no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('CategoryRepository.findIdsByCompany no implementado');
  }

  async create(_category) {
    throw new Error('CategoryRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('CategoryRepository.update no implementado');
  }
}
