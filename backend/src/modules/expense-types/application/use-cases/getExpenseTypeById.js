import { ExpenseTypeNotFoundError } from '../../domain/errors.js';

export class GetExpenseTypeByIdUseCase {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute(id, companyId) {
    const expenseType = await this.expenseTypeRepository.findById(id, companyId);
    if (!expenseType) throw new ExpenseTypeNotFoundError();
    return expenseType;
  }
}
