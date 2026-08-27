export class LocationRepository {
  async findAll(_criteria) {
    throw new Error('LocationRepository.findAll no implementado');
  }

  async findById(_id, _warehouseIds) {
    throw new Error('LocationRepository.findById no implementado');
  }

  // Usado por kardex para resolver "qué ubicaciones son de mi company" antes
  // de filtrar, igual que BranchRepository.findIdsByCompany.
  async findIdsByWarehouses(_warehouseIds) {
    throw new Error('LocationRepository.findIdsByWarehouses no implementado');
  }

  async findByCodeAndWarehouse(_code, _warehouseId) {
    throw new Error('LocationRepository.findByCodeAndWarehouse no implementado');
  }

  async findByCoordinatesAndWarehouse(_coordinates, _warehouseId) {
    throw new Error('LocationRepository.findByCoordinatesAndWarehouse no implementado');
  }

  async findCoordinatesAndCodesByWarehouse(_warehouseId) {
    throw new Error('LocationRepository.findCoordinatesAndCodesByWarehouse no implementado');
  }

  async create(_location) {
    throw new Error('LocationRepository.create no implementado');
  }

  async createMany(_locations) {
    throw new Error('LocationRepository.createMany no implementado');
  }

  async update(_id, _changes) {
    throw new Error('LocationRepository.update no implementado');
  }
}
