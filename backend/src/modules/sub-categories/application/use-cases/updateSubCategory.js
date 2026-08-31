import { extractGeoId } from '#shared/lib/geoValidation.js';
import { resolveCategoryIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  SubCategoryNotFoundError,
  DuplicateSubCategoryNameError,
} from '../../domain/errors.js';

export class UpdateSubCategoryUseCase {
  constructor(subCategoryRepository, categoryRepository) {
    this.subCategoryRepository = subCategoryRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(id, changes, companyId) {
    const categoryIds = await resolveCategoryIdsForCompany(companyId, this.categoryRepository);
    const subCategory = await this.subCategoryRepository.findById(id, categoryIds);
    if (!subCategory) throw new SubCategoryNotFoundError();

    if (changes.name && changes.name !== subCategory.name) {
      const nameTaken = await this.subCategoryRepository.findByNameAndCategory(changes.name, extractGeoId(subCategory.category));
      if (nameTaken) throw new DuplicateSubCategoryNameError();
    }

    return this.subCategoryRepository.update(id, changes);
  }
}
