/**
 * Puerto que el dominio/aplicación usan para persistir Company. No sabe nada de
 * Mongo/Mongoose: cualquier adaptador de infraestructura que implemente estos
 * métodos sirve (Mongo hoy, Postgres mañana, un fake en memoria en tests).
 */
export class CompanyRepository {
  async findAll(_criteria) {
    throw new Error('CompanyRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('CompanyRepository.findById no implementado');
  }

  async findBySlug(_slug) {
    throw new Error('CompanyRepository.findBySlug no implementado');
  }

  /**
   * Búsquedas públicas (sin auth): solo devuelven campos seguros
   * (slug, commercialName, logo), nunca nit/nrc/email/phone/address.
   */
  async searchPublic(_criteria) {
    throw new Error('CompanyRepository.searchPublic no implementado');
  }

  async findPublicBySlug(_slug) {
    throw new Error('CompanyRepository.findPublicBySlug no implementado');
  }

  async findByNit(_nit) {
    throw new Error('CompanyRepository.findByNit no implementado');
  }

  async findByNrc(_nrc) {
    throw new Error('CompanyRepository.findByNrc no implementado');
  }

  async create(_company) {
    throw new Error('CompanyRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('CompanyRepository.update no implementado');
  }
}
