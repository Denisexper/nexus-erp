import { ExpenseType } from '../../domain/ExpenseType.js';
import { DuplicateExpenseTypeNameError } from '../../domain/errors.js';

export class CreateExpenseTypeUseCase {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute({ name, description, company }) {
    const existing = await this.expenseTypeRepository.findByNameAndCompany(name, company);
    if (existing) throw new DuplicateExpenseTypeNameError();

    const expenseType = new ExpenseType({ name, description, company });
    return this.expenseTypeRepository.create(expenseType);
  }
}
