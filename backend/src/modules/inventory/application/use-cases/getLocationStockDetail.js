import { LocationNotFoundForInventoryError } from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

// Para el detalle de Ubicaciones, que hoy no muestra qué hay guardado ahí:
// qué lotes (con cantidad > 0) hay en una ubicación dada. El scoping por
// company lo hace locationRepository.findById, mismo patrón que
// assignLotToLocation.js.
export class GetLocationStockDetailUseCase {
  constructor(inventoryRepository, locationRepository, branchRepository, warehouseRepository) {
    this.inventoryRepository = inventoryRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(locationId, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(locationId, warehouseIds);
    if (!location) throw new LocationNotFoundForInventoryError();

    return this.inventoryRepository.findLotDetailsByLocation(locationId);
  }
}
