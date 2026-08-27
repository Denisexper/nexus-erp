import { MovementNotFoundError } from '../../domain/errors.js';
import { resolveLocationIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetMovementByIdUseCase {
  constructor(kardexRepository, branchRepository, warehouseRepository, locationRepository) {
    this.kardexRepository = kardexRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.locationRepository = locationRepository;
  }

  async execute(id, companyId) {
    const locationIds = await resolveLocationIdsForCompany(
      companyId, this.branchRepository, this.warehouseRepository, this.locationRepository,
    );
    const movement = await this.kardexRepository.findById(id, locationIds);
    if (!movement) throw new MovementNotFoundError();
    return movement;
  }
}
