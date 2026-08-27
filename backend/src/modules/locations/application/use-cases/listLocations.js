import { NO_MATCH_ID, resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListLocationsUseCase {
  constructor(locationRepository, branchRepository, warehouseRepository) {
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute({ companyId, search, warehouse, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let warehouseFilter = warehouse;
    if (companyId) {
      const companyWarehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
      warehouseFilter = warehouse
        ? (companyWarehouseIds.includes(warehouse) ? warehouse : NO_MATCH_ID)
        : { $in: companyWarehouseIds };
    }

    const { items, total } = await this.locationRepository.findAll({
      search,
      warehouse: warehouseFilter,
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
