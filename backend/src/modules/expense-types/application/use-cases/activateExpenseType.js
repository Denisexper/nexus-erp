import { ExpenseTypeNotFoundError } from '../../domain/errors.js';

export class ActivateExpenseTypeUseCase {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute(id, companyId) {
    const expenseType = await this.expenseTypeRepository.findById(id, companyId);
    if (!expenseType) throw new ExpenseTypeNotFoundError();

    return this.expenseTypeRepository.update(id, { isActive: true });
  }
}
