import { NO_MATCH_ID } from '#shared/lib/tenantScope.js';

export class ListWarehousesUseCase {
  constructor(warehouseRepository, branchRepository) {
    this.warehouseRepository = warehouseRepository;
    this.branchRepository = branchRepository;
  }

  async execute({ companyId, search, branch, warehouseCategory, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let branchFilter = branch;
    if (companyId) {
      const companyBranchIds = await this.branchRepository.findIdsByCompany(companyId);
      branchFilter = branch
        ? (companyBranchIds.includes(branch) ? branch : NO_MATCH_ID)
        : { $in: companyBranchIds };
    }

    const { items, total } = await this.warehouseRepository.findAll({
      search,
      branch: branchFilter,
      warehouseCategory,
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
