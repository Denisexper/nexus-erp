export class WarehouseRepository {
  async findAll(_criteria) {
    throw new Error('WarehouseRepository.findAll no implementado');
  }

  async findById(_id, _branchIds) {
    throw new Error('WarehouseRepository.findById no implementado');
  }

  async findByNameAndBranch(_name, _branchId) {
    throw new Error('WarehouseRepository.findByNameAndBranch no implementado');
  }

  // Usado por locations/kardex para resolver "qué almacenes son de mi
  // company" antes de filtrar, igual que BranchRepository.findIdsByCompany.
  async findIdsByBranches(_branchIds) {
    throw new Error('WarehouseRepository.findIdsByBranches no implementado');
  }

  async create(_warehouse) {
    throw new Error('WarehouseRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('WarehouseRepository.update no implementado');
  }
}
