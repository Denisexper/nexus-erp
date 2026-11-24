import {
  InventoryLotNotFoundError,
  InvalidAdjustmentQuantityError,
  InsufficientQuantityForAdjustmentError,
  AdjustmentReasonRequiredError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
} from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

const VALID_MOVEMENT_TYPES = ['adjustment', 'return'];

// Ajuste/devolución manual (ERS RN-INV-012 y Fase 5 del plan): la única vía
// para corregir existencias por fuera de compras/traslados — conteo físico,
// daño, devolución de cliente aceptada. A diferencia de assignLotToLocation
// y las "patas" de traslado, SÍ puede reducir existencias (decrease) y por
// lo tanto valida RN-INV-001 contra el saldo real en esa ubicación.
export class RegisterInventoryAdjustmentUseCase {
  constructor(inventoryRepository, locationRepository, branchRepository, warehouseRepository) {
    this.inventoryRepository = inventoryRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute({ inventoryLot, location, quantity, direction, movementType = 'adjustment', reason }, company, user) {
    const lot = await this.inventoryRepository.findLotById(inventoryLot, company);
    if (!lot) throw new InventoryLotNotFoundError();

    const qty = Number(quantity);
    if (!(qty > 0)) throw new InvalidAdjustmentQuantityError();
    if (!reason) throw new AdjustmentReasonRequiredError();

    const normalizedType = VALID_MOVEMENT_TYPES.includes(movementType) ? movementType : 'adjustment';
    const normalizedDirection = direction === 'increase' ? 'increase' : 'decrease';

    const warehouseIds = await resolveWarehouseIdsForCompany(company, this.branchRepository, this.warehouseRepository);
    const locationDoc = await this.locationRepository.findById(location, warehouseIds);
    if (!locationDoc) throw new LocationNotFoundForInventoryError();
    if (!locationDoc.isActive) throw new InactiveLocationForInventoryError();

    if (normalizedDirection === 'decrease') {
      const available = await this.inventoryRepository.getLotQuantityAtLocation(inventoryLot, location);
      if (qty > available + 0.0001) throw new InsufficientQuantityForAdjustmentError();
    }

    return this.inventoryRepository.recordValuedAdjustment({
      lot,
      warehouse: locationDoc.warehouse?._id || locationDoc.warehouse,
      location,
      quantity: qty,
      direction: normalizedDirection,
      movementType: normalizedType,
      referenceType: normalizedType,
      referenceId: lot.id,
      company,
      user,
    });
  }
}
