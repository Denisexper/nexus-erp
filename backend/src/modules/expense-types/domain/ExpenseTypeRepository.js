export class ExpenseTypeRepository {
  async findAll(_criteria) {
    throw new Error('ExpenseTypeRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('ExpenseTypeRepository.findById no implementado');
  }

  async findByNameAndCompany(_name, _companyId) {
    throw new Error('ExpenseTypeRepository.findByNameAndCompany no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('ExpenseTypeRepository.findIdsByCompany no implementado');
  }

  async create(_expenseType) {
    throw new Error('ExpenseTypeRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('ExpenseTypeRepository.update no implementado');
  }
}
