/**
 * Puerto que el dominio/aplicación usan para persistir Branch. No sabe nada de
 * Mongo/Mongoose: cualquier adaptador de infraestructura que implemente estos
 * métodos sirve.
 */
export class BranchRepository {
  async findAll(_criteria) {
    throw new Error('BranchRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('BranchRepository.findById no implementado');
  }

  async findByNameAndCompany(_name, _companyId) {
    throw new Error('BranchRepository.findByNameAndCompany no implementado');
  }

  async create(_branch) {
    throw new Error('BranchRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('BranchRepository.update no implementado');
  }
}
