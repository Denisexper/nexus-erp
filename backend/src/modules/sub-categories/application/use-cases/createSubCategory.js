import { SubCategory } from '../../domain/SubCategory.js';
import {
  CategoryNotFoundForSubCategoryError,
  DuplicateSubCategoryNameError,
} from '../../domain/errors.js';

export class CreateSubCategoryUseCase {
  constructor(subCategoryRepository, categoryRepository) {
    this.subCategoryRepository = subCategoryRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(data, companyId) {
    const category = await this.categoryRepository.findById(data.category, companyId);
    if (!category) throw new CategoryNotFoundForSubCategoryError();

    const nameTaken = await this.subCategoryRepository.findByNameAndCategory(data.name, data.category);
    if (nameTaken) throw new DuplicateSubCategoryNameError();

    const subCategory = new SubCategory(data);
    return this.subCategoryRepository.create(subCategory);
  }
}
