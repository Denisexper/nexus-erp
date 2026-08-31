import { NO_MATCH_ID, resolveSupplierIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListSupplierContactsUseCase {
  constructor(supplierContactRepository, supplierRepository) {
    this.supplierContactRepository = supplierContactRepository;
    this.supplierRepository = supplierRepository;
  }

  async execute({ search, companyId, supplier, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let supplierFilter = supplier;
    if (companyId) {
      const companySupplierIds = await resolveSupplierIdsForCompany(companyId, this.supplierRepository);
      supplierFilter = supplier
        ? (companySupplierIds.includes(supplier) ? supplier : NO_MATCH_ID)
        : { $in: companySupplierIds };
    }

    const { items, total } = await this.supplierContactRepository.findAll({
      search,
      supplier: supplierFilter,
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
