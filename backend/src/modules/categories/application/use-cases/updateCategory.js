import { CategoryNotFoundError, DuplicateCategoryNameError } from '../../domain/errors.js';

export class UpdateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id, changes, companyId) {
    const category = await this.categoryRepository.findById(id, companyId);
    if (!category) throw new CategoryNotFoundError();

    if (changes.name && changes.name !== category.name) {
      const nameTaken = await this.categoryRepository.findByNameAndCompany(changes.name, companyId);
      if (nameTaken) throw new DuplicateCategoryNameError();
    }

    return this.categoryRepository.update(id, changes);
  }
}
