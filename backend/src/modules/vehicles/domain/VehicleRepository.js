/**
 * Puerto que el dominio/aplicación usan para persistir Vehicle. No sabe nada
 * de Mongo/Mongoose: cualquier adaptador de infraestructura que implemente
 * estos métodos sirve.
 */
export class VehicleRepository {
  async findAll(_criteria) {
    throw new Error('VehicleRepository.findAll no implementado');
  }

  async findById(_id, _employeeIds) {
    throw new Error('VehicleRepository.findById no implementado');
  }

  async findByPlate(_plate) {
    throw new Error('VehicleRepository.findByPlate no implementado');
  }

  // Usado por tenantScope para resolver "qué vehículos son de mi company"
  // antes de filtrar, igual que EmployeeRepository.findIdsByBranches.
  async findIdsByEmployees(_employeeIds) {
    throw new Error('VehicleRepository.findIdsByEmployees no implementado');
  }

  async create(_vehicle) {
    throw new Error('VehicleRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('VehicleRepository.update no implementado');
  }
}
