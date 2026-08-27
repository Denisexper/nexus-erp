import { NO_MATCH_ID, resolveLocationIdsForCompany } from '#shared/lib/tenantScope.js';

export class ListMovementsUseCase {
  constructor(kardexRepository, branchRepository, warehouseRepository, locationRepository) {
    this.kardexRepository = kardexRepository;
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

    return this.kardexRepository.findAll({ ...criteria, location: locationFilter });
  }
}
