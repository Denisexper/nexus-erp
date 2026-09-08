import { ExpenseTypeNotFoundError, DuplicateExpenseTypeNameError } from '../../domain/errors.js';

export class UpdateExpenseTypeUseCase {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute(id, changes, companyId) {
    const expenseType = await this.expenseTypeRepository.findById(id, companyId);
    if (!expenseType) throw new ExpenseTypeNotFoundError();

    if (changes.name && changes.name !== expenseType.name) {
      const nameTaken = await this.expenseTypeRepository.findByNameAndCompany(changes.name, companyId);
      if (nameTaken) throw new DuplicateExpenseTypeNameError();
    }

    return this.expenseTypeRepository.update(id, changes);
  }
}
