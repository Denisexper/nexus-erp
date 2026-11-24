import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError } from '../../domain/errors.js';

// EN_TRANSITO -> INCIDENCIA (ERS 6.9.19): solo cambia de estado y deja la
// nota del problema. La mercancía queda "parada" en la ubicación vehículo —
// no se mueve nada, no se revierte nada. La resolución manual de la
// incidencia queda fuera de alcance de esta fase.
export class ReportTransferIncidentUseCase {
  constructor(inventoryTransferRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
  }

  async execute(transferId, { notes }, company) {
    const transfer = await this.inventoryTransferRepository.findById(transferId, company);
    if (!transfer) throw new InventoryTransferNotFoundError();
    if (transfer.status !== 'in_transit') throw new InvalidTransferStatusTransitionError(transfer.status, 'incident');

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'incident', notes });
  }
}
