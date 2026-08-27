import { LocationNotFoundError } from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetLocationByIdUseCase {
  constructor(locationRepository, branchRepository, warehouseRepository) {
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(id, warehouseIds);
    if (!location) throw new LocationNotFoundError();
    return location;
  }
}
