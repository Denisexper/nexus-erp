import { LocationNotFoundForKardexError } from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetStockByLocationUseCase {
  constructor(kardexRepository, locationRepository, branchRepository, warehouseRepository) {
    this.kardexRepository = kardexRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(locationId, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(locationId, warehouseIds);
    if (!location) throw new LocationNotFoundForKardexError();

    return this.kardexRepository.getStockByLocation(locationId);
  }
}
