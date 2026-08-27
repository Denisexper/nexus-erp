import { Location } from '../../domain/Location.js';
import { resolveBranchIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  WarehouseNotFoundForLocationError,
  InvalidCapacityError,
  InvalidBatchRangeError,
  BatchSizeExceededError,
} from '../../domain/errors.js';

export const MAX_BATCH_LOCATIONS = 500;

const COORDINATE_FIELDS = ['aisle', 'rack', 'level', 'position'];

// Cada coordenada es "prefijo fijo" + "rango numérico" (desde/hasta), ambos
// opcionales. Si no hay rango, la coordenada queda fija en el prefijo (igual
// que hoy, donde aisle/rack/level/position son texto libre opcional).
const resolveCoordinateValues = (prefix = '', from, to) => {
  const hasFrom = from !== undefined && from !== null && from !== '';
  const hasTo = to !== undefined && to !== null && to !== '';

  if (!hasFrom && !hasTo) return [prefix];

  const fromNum = Number(from);
  const toNum = Number(to);
  if (!hasFrom || !hasTo || !Number.isInteger(fromNum) || !Number.isInteger(toNum) || fromNum > toNum) {
    throw new InvalidBatchRangeError();
  }

  const values = [];
  for (let n = fromNum; n <= toNum; n += 1) values.push(`${prefix}${n}`);
  return values;
};

const buildCode = ({ aisle, rack, level, position }) =>
  [aisle, rack, level, position].filter(Boolean).join('-');

export class CreateLocationsBatchUseCase {
  constructor(locationRepository, warehouseRepository, branchRepository) {
    this.locationRepository = locationRepository;
    this.warehouseRepository = warehouseRepository;
    this.branchRepository = branchRepository;
  }

  async execute(data, companyId) {
    const branchIds = await resolveBranchIdsForCompany(companyId, this.branchRepository);
    const warehouse = await this.warehouseRepository.findById(data.warehouse, branchIds);
    if (!warehouse) throw new WarehouseNotFoundForLocationError();

    if (!(Number(data.capacity) > 0)) throw new InvalidCapacityError();

    const valuesByField = {
      aisle: resolveCoordinateValues(data.aislePrefix, data.aisleFrom, data.aisleTo),
      rack: resolveCoordinateValues(data.rackPrefix, data.rackFrom, data.rackTo),
      level: resolveCoordinateValues(data.levelPrefix, data.levelFrom, data.levelTo),
      position: resolveCoordinateValues(data.positionPrefix, data.positionFrom, data.positionTo),
    };

    const totalRequested = COORDINATE_FIELDS.reduce(
      (total, field) => total * valuesByField[field].length,
      1,
    );
    if (totalRequested > MAX_BATCH_LOCATIONS) {
      throw new BatchSizeExceededError(MAX_BATCH_LOCATIONS, totalRequested);
    }

    const combinations = [];
    for (const aisle of valuesByField.aisle) {
      for (const rack of valuesByField.rack) {
        for (const level of valuesByField.level) {
          for (const position of valuesByField.position) {
            const coordinates = { aisle, rack, level, position };
            combinations.push({ ...coordinates, code: buildCode(coordinates) });
          }
        }
      }
    }

    const existing = await this.locationRepository.findCoordinatesAndCodesByWarehouse(data.warehouse);
    const existingCoordKeys = new Set(
      existing.map((loc) => [loc.aisle, loc.rack, loc.level, loc.position].join('|')),
    );
    const existingCodes = new Set(existing.map((loc) => loc.code));

    const toCreate = [];
    const skipped = [];
    for (const combo of combinations) {
      const coordKey = [combo.aisle, combo.rack, combo.level, combo.position].join('|');
      if (existingCoordKeys.has(coordKey) || existingCodes.has(combo.code)) {
        skipped.push(combo.code);
      } else {
        toCreate.push(combo);
      }
    }

    const created = toCreate.length
      ? await this.locationRepository.createMany(
          toCreate.map(
            (combo) =>
              new Location({
                warehouse: data.warehouse,
                code: combo.code,
                aisle: combo.aisle,
                rack: combo.rack,
                level: combo.level,
                position: combo.position,
                capacity: data.capacity,
                notes: data.notes,
              }),
          ),
        )
      : [];

    return {
      totalRequested,
      createdCount: created.length,
      created: created.map((loc) => loc.code),
      skippedCount: skipped.length,
      skipped,
    };
  }
}
