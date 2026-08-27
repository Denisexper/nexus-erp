import { LocationNotFoundError, LocationHasStockError } from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

export class DeactivateLocationUseCase {
  constructor(locationRepository, kardexRepository, branchRepository, warehouseRepository) {
    this.locationRepository = locationRepository;
    this.kardexRepository = kardexRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(id, warehouseIds);
    if (!location) throw new LocationNotFoundError();

    // RN-WHS-007: no desactivar una ubicación con existencias.
    const totalStock = await this.kardexRepository.getTotalStockByLocation(id);
    if (totalStock > 0) throw new LocationHasStockError();

    return this.locationRepository.update(id, { isActive: false });
  }
}
