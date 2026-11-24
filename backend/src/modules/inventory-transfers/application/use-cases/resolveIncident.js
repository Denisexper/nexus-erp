import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError } from '../../domain/errors.js';

const VALID_ACTIONS = ['resume', 'write_off'];

// Resolución manual de una incidencia (Fase 5, ERS 6.9.19 "la resolución
// manual de la incidencia queda fuera de alcance" del plan original de
// traslados — ahora sí se implementa):
//   - 'resume': el problema se resolvió (ej. camión reparado), el traslado
//     vuelve a 'in_transit' tal cual estaba, sin tocar el inventario.
//   - 'write_off': la mercancía se da por perdida. Como receiveTransfer ya
//     no mueve nada del origen hasta que de verdad llega, la pérdida nunca
//     salió del origen en el libro — no hace falta ningún ajuste de
//     inventario, solo se cierra el traslado en 'resolved' con las líneas
//     en 0 recibido.
export class ResolveIncidentUseCase {
  constructor(inventoryTransferRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
  }

  async execute(transferId, { action, notes }, company, user) {
    const transfer = await this.inventoryTransferRepository.findById(transferId, company);
    if (!transfer) throw new InventoryTransferNotFoundError();
    if (transfer.status !== 'incident') throw new InvalidTransferStatusTransitionError(transfer.status, 'resolved');

    const normalizedAction = VALID_ACTIONS.includes(action) ? action : 'resume';

    if (normalizedAction === 'resume') {
      return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'in_transit', notes });
    }

    for (const detail of transfer.details) {
      await this.inventoryTransferRepository.updateDetailReceived(detail.id, 0);
    }

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'resolved', notes });
  }
}
