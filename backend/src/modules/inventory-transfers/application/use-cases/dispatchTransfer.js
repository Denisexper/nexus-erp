import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError, InsufficientQuantityAtSourceError } from '../../domain/errors.js';

// EN_PREPARACION -> EN_TRANSITO (ERS 6.9.19): solo valida que haya stock
// disponible en origen y marca el traslado como despachado. El movimiento
// real de inventario se registra hasta recibirTransfer (ver receiveTransfer.js)
// con la cantidad que de verdad llegó — no hay ubicación intermedia de
// "vehículo" en el ledger.
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

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'in_transit', dispatchedAt: new Date() });
  }
}
