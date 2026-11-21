import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError, InvalidReceivedQuantityError } from '../../domain/errors.js';

// EN_TRANSITO -> RECIBIDO (ERS 6.9.19): registra, por cada línea, un único
// movimiento 'transfer' de origen a destino con la cantidad que de verdad
// llegó (mismo lote y costo, nunca toca el costo promedio — RN-INV-015). Si
// llega menos de lo despachado, la diferencia simplemente no se escribe en
// ningún lado — nunca salió del origen en el libro, así que no hace falta
// ningún ajuste de merma aparte.
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
    const sourceWarehouseId = transfer.sourceWarehouse?._id || transfer.sourceWarehouse;
    const destinationWarehouseId = transfer.destinationWarehouse?._id || transfer.destinationWarehouse;

    for (const detail of transfer.details) {
      const quantityReceived = receiptByDetailId.has(detail.id) ? Number(receiptByDetailId.get(detail.id)) : detail.quantityDispatched;
      if (!(quantityReceived >= 0) || quantityReceived > detail.quantityDispatched) throw new InvalidReceivedQuantityError();

      const lotId = detail.inventoryLot?._id || detail.inventoryLot;
      const fullLot = await this.inventoryRepository.findLotById(lotId, company);
      const destinationLocationId = detail.destinationLocation?._id || detail.destinationLocation;

      if (quantityReceived > 0) {
        await this.inventoryRepository.recordTransferLeg({
          lot: fullLot,
          fromWarehouse: sourceWarehouseId,
          toWarehouse: destinationWarehouseId,
          fromLocation: detail.sourceLocation?._id || detail.sourceLocation,
          toLocation: destinationLocationId,
          quantity: quantityReceived,
          company,
          user,
          referenceId: transfer.id,
        });
      }

      await this.inventoryTransferRepository.updateDetailReceived(detail.id, quantityReceived);
    }

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'received', receivedAt: new Date() });
  }
}
