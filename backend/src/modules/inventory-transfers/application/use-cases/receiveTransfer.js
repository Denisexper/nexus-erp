import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError, InvalidReceivedQuantityError } from '../../domain/errors.js';

// EN_TRANSITO -> RECIBIDO (ERS 6.9.19): registra, por cada línea, una salida
// de la ubicación vehículo y una entrada en la ubicación de destino, mismo
// lote y costo. Si llega menos de lo despachado (merma), se escribe además
// un movimiento 'adjustment' compensatorio para que no quede "flotando" en
// la ubicación vehículo (ver recordInventoryAdjustment del módulo núcleo).
export class ReceiveTransferUseCase {
  constructor(inventoryTransferRepository, inventoryRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(transferId, { receipts = [] } = {}, company, user) {
    const transfer = await this.inventoryTransferRepository.findById(transferId, company);
    if (!transfer) throw new InventoryTransferNotFoundError();
    if (transfer.status !== 'in_transit') throw new InvalidTransferStatusTransitionError(transfer.status, 'received');

    const receiptByDetailId = new Map(receipts.map((r) => [String(r.detailId), r.quantityReceived]));
    const vehicleLocationId = transfer.vehicleLocation?._id || transfer.vehicleLocation;
    const vehicleWarehouseId = transfer.vehicleLocation?.warehouse;

    for (const detail of transfer.details) {
      const quantityReceived = receiptByDetailId.has(detail.id) ? Number(receiptByDetailId.get(detail.id)) : detail.quantityDispatched;
      if (!(quantityReceived >= 0) || quantityReceived > detail.quantityDispatched) throw new InvalidReceivedQuantityError();

      const lotId = detail.inventoryLot?._id || detail.inventoryLot;
      const fullLot = await this.inventoryRepository.findLotById(lotId, company);
      const destinationLocationId = detail.destinationLocation?._id || detail.destinationLocation;

      if (quantityReceived > 0) {
        await this.inventoryRepository.recordTransferLeg({
          lot: fullLot,
          fromWarehouse: vehicleWarehouseId,
          toWarehouse: transfer.destinationWarehouse?._id || transfer.destinationWarehouse,
          fromLocation: vehicleLocationId,
          toLocation: destinationLocationId,
          quantity: quantityReceived,
          company,
          user,
          referenceId: transfer.id,
        });
      }

      const shrinkage = detail.quantityDispatched - quantityReceived;
      if (shrinkage > 0.0001) {
        await this.inventoryRepository.recordInventoryAdjustment({
          lot: fullLot,
          warehouse: vehicleWarehouseId,
          location: vehicleLocationId,
          quantity: shrinkage,
          referenceId: transfer.id,
          user,
        });
      }

      await this.inventoryTransferRepository.updateDetailReceived(detail.id, quantityReceived);
    }

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'received', receivedAt: new Date() });
  }
}
