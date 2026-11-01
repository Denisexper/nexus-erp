export class InventoryTransferDetail {
  constructor({
    id,
    inventoryTransfer,
    inventoryLot,
    product,
    sourceLocation,
    destinationLocation,
    quantityDispatched,
    quantityReceived,
    unitCost,
    notes,
  }) {
    this.id = id;
    this.inventoryTransfer = inventoryTransfer;
    this.inventoryLot = inventoryLot;
    this.product = product; // denormalizado del lote, para no tener que poblar el lote solo para mostrar el producto
    this.sourceLocation = sourceLocation;
    this.destinationLocation = destinationLocation;
    this.quantityDispatched = quantityDispatched;
    this.quantityReceived = quantityReceived; // null hasta que se recibe; puede ser menor (merma)
    this.unitCost = unitCost; // copiado de lot.unitCost al crear, de solo lectura (RN-INV-015: el traslado no recalcula costo)
    this.notes = notes;
  }
}
