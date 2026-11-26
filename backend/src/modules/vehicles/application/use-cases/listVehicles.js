import { NO_MATCH_ID, resolveEmployeeIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListVehiclesUseCase {
  constructor(vehicleRepository, employeeRepository, branchRepository) {
    this.vehicleRepository = vehicleRepository;
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute({ companyId, search, employee, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let employeeFilter = employee;
    if (companyId) {
      const companyEmployeeIds = await resolveEmployeeIdsForCompany(companyId, this.branchRepository, this.employeeRepository);
      employeeFilter = employee
        ? (companyEmployeeIds.includes(employee) ? employee : NO_MATCH_ID)
        : { $in: companyEmployeeIds };
    }

    const { items, total } = await this.vehicleRepository.findAll({
      search,
      employee: employeeFilter,
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
