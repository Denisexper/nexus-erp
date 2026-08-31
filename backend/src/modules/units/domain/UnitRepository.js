export class UnitRepository {
  async findAll(_criteria) {
    throw new Error('UnitRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('UnitRepository.findById no implementado');
  }

  async findByNameAndCompany(_name, _companyId) {
    throw new Error('UnitRepository.findByNameAndCompany no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('UnitRepository.findIdsByCompany no implementado');
  }

  async create(_unit) {
    throw new Error('UnitRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('UnitRepository.update no implementado');
  }
}
