/**
 * Puerto que el dominio/aplicación usan para persistir User. No sabe nada de
 * Mongo/Mongoose: cualquier adaptador de infraestructura que implemente estos
 * métodos sirve.
 */
export class UserRepository {
  async findAll(_criteria) {
    throw new Error('UserRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('UserRepository.findById no implementado');
  }

  async findByEmailAndCompany(_email, _companyId) {
    throw new Error('UserRepository.findByEmailAndCompany no implementado');
  }

  async create(_user) {
    throw new Error('UserRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('UserRepository.update no implementado');
  }

  async remove(_id, _companyId) {
    throw new Error('UserRepository.remove no implementado');
  }

  async countByRole(_roleId) {
    throw new Error('UserRepository.countByRole no implementado');
  }
}
