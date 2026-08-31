import { NO_MATCH_ID, resolveCategoryIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListSubCategoriesUseCase {
  constructor(subCategoryRepository, categoryRepository) {
    this.subCategoryRepository = subCategoryRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute({ search, companyId, category, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let categoryFilter = category;
    if (companyId) {
      const companyCategoryIds = await resolveCategoryIdsForCompany(companyId, this.categoryRepository);
      categoryFilter = category
        ? (companyCategoryIds.includes(category) ? category : NO_MATCH_ID)
        : { $in: companyCategoryIds };
    }

    const { items, total } = await this.subCategoryRepository.findAll({
      search,
      category: categoryFilter,
      isActive,
      page: pageNum,
      limit: limitNum,
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
