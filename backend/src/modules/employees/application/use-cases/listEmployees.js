import { NO_MATCH_ID } from '#shared/lib/tenantScope.js';

export class ListEmployeesUseCase {
  constructor(employeeRepository, branchRepository) {
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute({ companyId, search, branch, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let branchFilter = branch;
    if (companyId) {
      const companyBranchIds = await this.branchRepository.findIdsByCompany(companyId);
      branchFilter = branch
        ? (companyBranchIds.includes(branch) ? branch : NO_MATCH_ID)
        : { $in: companyBranchIds };
    }

    const { items, total } = await this.employeeRepository.findAll({
      search,
      branch: branchFilter,
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
