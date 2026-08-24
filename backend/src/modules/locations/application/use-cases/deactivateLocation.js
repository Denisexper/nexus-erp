import { LocationNotFoundError, LocationHasStockError } from '../../domain/errors.js';

export class DeactivateLocationUseCase {
  constructor(locationRepository, kardexRepository) {
    this.locationRepository = locationRepository;
    this.kardexRepository = kardexRepository;
  }

  async execute(id) {
    const location = await this.locationRepository.findById(id);
    if (!location) throw new LocationNotFoundError();

    // RN-WHS-007: no desactivar una ubicación con existencias.
    const totalStock = await this.kardexRepository.getTotalStockByLocation(id);
    if (totalStock > 0) throw new LocationHasStockError();

    return this.locationRepository.update(id, { isActive: false });
  }
}
