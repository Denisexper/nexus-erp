import { InventoryTransferNotFoundError, InvalidTransferStatusTransitionError } from '../../domain/errors.js';

const VALID_ACTIONS = ['resume', 'write_off'];

// Resolución manual de una incidencia (Fase 5, ERS 6.9.19 "la resolución
// manual de la incidencia queda fuera de alcance" del plan original de
// traslados — ahora sí se implementa):
//   - 'resume': el problema se resolvió (ej. camión reparado), el traslado
//     vuelve a 'in_transit' tal cual estaba, sin tocar el inventario.
//   - 'write_off': la mercancía se da por perdida — se registra un ajuste
//     valorizado de salida por cada línea (mismo costo promedio vigente,
//     SÍ afecta inventory_cost_averages, a diferencia del ajuste de merma
//     parcial de receiveTransfer) y el traslado cierra en 'resolved'.
export class ResolveIncidentUseCase {
  constructor(inventoryTransferRepository, inventoryRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(transferId, { action, notes }, company, user) {
    const transfer = await this.inventoryTransferRepository.findById(transferId, company);
    if (!transfer) throw new InventoryTransferNotFoundError();
    if (transfer.status !== 'incident') throw new InvalidTransferStatusTransitionError(transfer.status, 'resolved');

    const normalizedAction = VALID_ACTIONS.includes(action) ? action : 'resume';

    if (normalizedAction === 'resume') {
      return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'in_transit', notes });
    }

    const vehicleLocationId = transfer.vehicleLocation?._id || transfer.vehicleLocation;
    const vehicleWarehouseId = transfer.vehicleLocation?.warehouse;

    for (const detail of transfer.details) {
      const lotId = detail.inventoryLot?._id || detail.inventoryLot;
      const fullLot = await this.inventoryRepository.findLotById(lotId, company);

      await this.inventoryRepository.recordValuedAdjustment({
        lot: fullLot,
        warehouse: vehicleWarehouseId,
        location: vehicleLocationId,
        quantity: detail.quantityDispatched,
        direction: 'decrease',
        movementType: 'adjustment',
        referenceType: 'transfer',
        referenceId: transfer.id,
        company,
        user,
      });

      await this.inventoryTransferRepository.updateDetailReceived(detail.id, 0);
    }

    return this.inventoryTransferRepository.updateStatus(transfer.id, { status: 'resolved', notes });
  }
}
