import {
  InventoryLotNotFoundError,
  InventoryLotNotPlaceableError,
  InvalidAssignQuantityError,
  AssignQuantityExceedsAvailableError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
} from '../../domain/errors.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// "Asignar a ubicación" (ERS 6.9.12): el único punto donde un lote recién
// recibido pasa a contar como stock real. Genera, en una sola transacción
// (InventoryRepository.assignLotToLocation), el movimiento de entrada, el
// saldo por ubicación y el costo promedio — ver plan de implementación.
export class AssignLotToLocationUseCase {
  constructor(inventoryRepository, locationRepository, branchRepository, warehouseRepository) {
    this.inventoryRepository = inventoryRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute({ inventoryLot, location, quantity }, company, user) {
    const lot = await this.inventoryRepository.findLotById(inventoryLot, company);
    if (!lot) throw new InventoryLotNotFoundError();
    if (!['pending_placement', 'partially_placed'].includes(lot.status)) throw new InventoryLotNotPlaceableError();

    const qty = Number(quantity);
    if (!(qty > 0)) throw new InvalidAssignQuantityError();

    const remaining = round2(lot.quantityReceived - lot.quantityAssigned);
    if (qty > remaining + 0.0001) throw new AssignQuantityExceedsAvailableError();

    const warehouseIds = await resolveWarehouseIdsForCompany(company, this.branchRepository, this.warehouseRepository);
    const locationDoc = await this.locationRepository.findById(location, warehouseIds);
    if (!locationDoc) throw new LocationNotFoundForInventoryError();
    if (!locationDoc.isActive) throw new InactiveLocationForInventoryError();

    return this.inventoryRepository.assignLotToLocation({
      lot,
      location,
      warehouse: locationDoc.warehouse?._id || locationDoc.warehouse,
      quantity: qty,
      company,
      user,
      referenceType: 'purchase',
      referenceId: lot.purchaseDetail,
    });
  }
}
