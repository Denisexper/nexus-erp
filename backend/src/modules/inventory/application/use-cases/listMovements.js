import { NO_MATCH_ID, resolveLocationIdsForCompany } from '#shared/lib/tenantScope.js';

// ERS 6.9.16: Kardex por producto, lote, almacén, ubicación o rango de
// fechas — reemplaza al kardex.listMovements viejo, mismo criterio de
// tenant scoping (todo movimiento tiene `location`, se escopa por ahí).
export class ListMovementsUseCase {
  constructor(inventoryRepository, branchRepository, warehouseRepository, locationRepository) {
    this.inventoryRepository = inventoryRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.locationRepository = locationRepository;
  }

  async execute({ companyId, location, ...criteria } = {}) {
    let locationFilter = location;
    if (companyId) {
      const companyLocationIds = await resolveLocationIdsForCompany(
        companyId, this.branchRepository, this.warehouseRepository, this.locationRepository,
      );
      locationFilter = location
        ? (companyLocationIds.includes(location) ? location : NO_MATCH_ID)
        : { $in: companyLocationIds };
    }

    return this.inventoryRepository.findMovements({ ...criteria, location: locationFilter });
  }
}
