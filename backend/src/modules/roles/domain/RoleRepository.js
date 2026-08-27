/**
 * Puerto que el dominio/aplicación usan para persistir Role. No sabe nada de
 * Mongo/Mongoose: cualquier adaptador de infraestructura que implemente estos
 * métodos sirve.
 */
export class RoleRepository {
  async findAll(_criteria) {
    throw new Error('RoleRepository.findAll no implementado');
  }

  // companyId siempre requerido: un rol solo existe dentro de una empresa,
  // buscarlo sin filtrar por company sería un IDOR cross-tenant (mismo
  // patrón que MongoBranchRepository.findById).
  async findById(_id, _companyId) {
    throw new Error('RoleRepository.findById no implementado');
  }

  async findByName(_name, _companyId) {
    throw new Error('RoleRepository.findByName no implementado');
  }

  // Resuelve un rol ya sea que `value` sea un id o un nombre, siempre
  // acotado a companyId. Lo usa el módulo users al crear/registrar cuentas,
  // donde el campo "role" puede venir como cualquiera de los dos desde el
  // cliente.
  async findByIdOrName(_value, _companyId) {
    throw new Error('RoleRepository.findByIdOrName no implementado');
  }

  async create(_role) {
    throw new Error('RoleRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('RoleRepository.update no implementado');
  }

  async remove(_id) {
    throw new Error('RoleRepository.remove no implementado');
  }
}
