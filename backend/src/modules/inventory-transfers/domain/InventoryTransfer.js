// EN_PREPARACION / EN_TRANSITO / RECIBIDO / INCIDENCIA del ERS 6.9.19, en
// inglés para seguir la convención del resto del codebase (los enums de
// Mongo son en inglés, los mensajes al usuario en español).
export const INVENTORY_TRANSFER_STATUSES = ['preparing', 'in_transit', 'received', 'incident'];

export class InventoryTransfer {
  constructor({
    id,
    company,
    transferCode,
    sourceWarehouse,
    destinationWarehouse,
    vehicleLocation,
    transferDate,
    dispatchedAt,
    receivedAt,
    status = 'preparing',
    user,
    notes,
    details = [],
    createdAt,
  }) {
    this.id = id;
    this.company = company;
    this.transferCode = transferCode; // ej: TRF-00001, único por company
    this.sourceWarehouse = sourceWarehouse;
    this.destinationWarehouse = destinationWarehouse;
    this.vehicleLocation = vehicleLocation; // ubicación tipo 'vehicle' donde la mercancía queda "en tránsito"
    this.transferDate = transferDate;
    this.dispatchedAt = dispatchedAt;
    this.receivedAt = receivedAt;
    this.status = status;
    this.user = user; // id de User que creó el traslado
    this.notes = notes;
    this.details = details; // InventoryTransferDetail[]
    this.createdAt = createdAt;
  }
}
