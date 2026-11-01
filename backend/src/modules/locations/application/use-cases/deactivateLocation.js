import { LocationNotFoundError, LocationHasStockError } from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

export class DeactivateLocationUseCase {
  constructor(locationRepository, inventoryRepository, branchRepository, warehouseRepository) {
    this.locationRepository = locationRepository;
    this.inventoryRepository = inventoryRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(id, warehouseIds);
    if (!location) throw new LocationNotFoundError();

    // RN-WHS-007: no desactivar una ubicación con existencias.
    const totalStock = await this.inventoryRepository.getLocationStock(id);
    if (totalStock > 0) throw new LocationHasStockError();

    return this.locationRepository.update(id, { isActive: false });
  }
}
