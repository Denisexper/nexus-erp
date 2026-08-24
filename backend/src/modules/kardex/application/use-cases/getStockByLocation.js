import { LocationNotFoundForKardexError } from '../../domain/errors.js';

export class GetStockByLocationUseCase {
  constructor(kardexRepository, locationRepository) {
    this.kardexRepository = kardexRepository;
    this.locationRepository = locationRepository;
  }

  async execute(locationId) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) throw new LocationNotFoundForKardexError();

    return this.kardexRepository.getStockByLocation(locationId);
  }
}
