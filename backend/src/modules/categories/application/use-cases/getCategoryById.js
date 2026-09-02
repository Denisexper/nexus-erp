import { CategoryNotFoundError } from '../../domain/errors.js';

export class GetCategoryByIdUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id, companyId) {
    const category = await this.categoryRepository.findById(id, companyId);
    if (!category) throw new CategoryNotFoundError();
    return category;
  }
}
