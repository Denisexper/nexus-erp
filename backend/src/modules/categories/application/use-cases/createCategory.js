import { Category } from '../../domain/Category.js';
import { DuplicateCategoryNameError } from '../../domain/errors.js';

export class CreateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute({ name, description, company }) {
    const existing = await this.categoryRepository.findByNameAndCompany(name, company);
    if (existing) throw new DuplicateCategoryNameError();

    const category = new Category({ name, description, company });
    return this.categoryRepository.create(category);
  }
}
