import { extractGeoId } from '#shared/lib/geoValidation.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  LocationNotFoundError,
  DuplicateLocationCodeError,
  InvalidCapacityError,
  DuplicateLocationCoordinatesError,
} from '../../domain/errors.js';

const COORDINATE_FIELDS = ['aisle', 'rack', 'level', 'position'];

export class UpdateLocationUseCase {
  constructor(locationRepository, branchRepository, warehouseRepository) {
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, changes, companyId) {
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(id, warehouseIds);
    if (!location) throw new LocationNotFoundError();

    if (changes.code && changes.code !== location.code) {
      const codeTaken = await this.locationRepository.findByCodeAndWarehouse(changes.code, extractGeoId(location.warehouse));
      if (codeTaken) throw new DuplicateLocationCodeError();
    }

    if (changes.capacity !== undefined && !(Number(changes.capacity) > 0)) {
      throw new InvalidCapacityError();
    }

    const touchesCoordinates = COORDINATE_FIELDS.some((field) => changes[field] !== undefined);
    if (touchesCoordinates) {
      const coordinates = {
        aisle: changes.aisle ?? location.aisle,
        rack: changes.rack ?? location.rack,
        level: changes.level ?? location.level,
        position: changes.position ?? location.position,
      };
      const coordinatesTaken = await this.locationRepository.findByCoordinatesAndWarehouse(coordinates, extractGeoId(location.warehouse));
      if (coordinatesTaken && coordinatesTaken.id !== id) throw new DuplicateLocationCoordinatesError();
    }

    return this.locationRepository.update(id, changes);
  }
}
