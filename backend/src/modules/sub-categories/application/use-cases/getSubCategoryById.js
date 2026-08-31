import { SubCategoryNotFoundError } from '../../domain/errors.js';
import { resolveCategoryIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetSubCategoryByIdUseCase {
  constructor(subCategoryRepository, categoryRepository) {
    this.subCategoryRepository = subCategoryRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(id, companyId) {
    const categoryIds = await resolveCategoryIdsForCompany(companyId, this.categoryRepository);
    const subCategory = await this.subCategoryRepository.findById(id, categoryIds);
    if (!subCategory) throw new SubCategoryNotFoundError();
    return subCategory;
  }
}
