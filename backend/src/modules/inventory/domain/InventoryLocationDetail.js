// Saldo actual de un lote en una ubicación física (ERS 6.9.6). Único por
// (inventoryLot, location) — un mismo lote puede tener varios registros, uno
// por cada ubicación donde tenga existencia.
export class InventoryLocationDetail {
  constructor({ id, inventoryLot, location, quantity = 0, updatedAt }) {
    this.id = id;
    this.inventoryLot = inventoryLot;
    this.location = location;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
  }
}
