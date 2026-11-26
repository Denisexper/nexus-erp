/**
 * Puerto que el dominio/aplicación usan para persistir Employee. No sabe nada
 * de Mongo/Mongoose: cualquier adaptador de infraestructura que implemente
 * estos métodos sirve.
 */
export class EmployeeRepository {
  async findAll(_criteria) {
    throw new Error('EmployeeRepository.findAll no implementado');
  }

  async findById(_id, _branchIds) {
    throw new Error('EmployeeRepository.findById no implementado');
  }

  async findByDui(_dui) {
    throw new Error('EmployeeRepository.findByDui no implementado');
  }

  // Usado por vehicles/tenantScope para resolver "qué empleados son de mi
  // company" antes de filtrar, igual que WarehouseRepository.findIdsByBranches.
  async findIdsByBranches(_branchIds) {
    throw new Error('EmployeeRepository.findIdsByBranches no implementado');
  }

  async create(_employee) {
    throw new Error('EmployeeRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('EmployeeRepository.update no implementado');
  }
}
