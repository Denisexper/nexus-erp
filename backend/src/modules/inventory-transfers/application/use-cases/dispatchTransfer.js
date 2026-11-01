import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError, InsufficientQuantityAtSourceError } from '../../domain/errors.js';

// EN_PREPARACION -> EN_TRANSITO (ERS 6.9.19): registra, por cada línea, una
// salida en la ubicación de origen y una entrada en la ubicación vehículo —
// mismo lote y costo, nunca toca el costo promedio (RN-INV-015).
export class DispatchTransferUseCase {
  constructor(inventoryTransferRepository, inventoryRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(transferId, company, user) {
    const transfer = await this.inventoryTransferRepository.findById(transferId, company);
    if (!transfer) throw new InventoryTransferNotFoundError();
    if (transfer.status !== 'preparing') throw new InvalidTransferStatusTransitionError(transfer.status, 'in_transit');

    for (const detail of transfer.details) {
      const lotId = detail.inventoryLot?._id || detail.inventoryLot;
      const sourceLocationId = detail.sourceLocation?._id || detail.sourceLocation;
      const available = await this.inventoryRepository.getLotQuantityAtLocation(lotId, sourceLocationId);
      if (detail.quantityDispatched > available + 0.0001) throw new InsufficientQuantityAtSourceError();
    }

    const vehicleLocationId = transfer.vehicleLocation?._id || transfer.vehicleLocation;
    const vehicleWarehouseId = transfer.vehicleLocation?.warehouse;

    for (const detail of transfer.details) {
      const lotId = detail.inventoryLot?._id || detail.inventoryLot;
      const fullLot = await this.inventoryRepository.findLotById(lotId, company);
      await this.inventoryRepository.recordTransferLeg({
        lot: fullLot,
        fromWarehouse: transfer.sourceWarehouse?._id || transfer.sourceWarehouse,
        toWarehouse: vehicleWarehouseId,
        fromLocation: detail.sourceLocation?._id || detail.sourceLocation,
        toLocation: vehicleLocationId,
        quantity: detail.quantityDispatched,
        company,
        user,
        referenceId: transfer.id,
      });
    }

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'in_transit', dispatchedAt: new Date() });
  }
}
