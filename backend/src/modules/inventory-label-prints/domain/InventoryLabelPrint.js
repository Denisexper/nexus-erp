// Auditoría de impresión/reimpresión de etiquetas (ERS 6.9.9). No es
// "reimpresión" por un flag que mande el usuario: se calcula sola según si
// el lote ya tiene impresiones previas (ver printLabel.js).
export class InventoryLabelPrint {
  constructor({ id, inventoryLot, quantityPrinted, printDate, user, reprintReason, createdAt }) {
    this.id = id;
    this.inventoryLot = inventoryLot;
    this.quantityPrinted = quantityPrinted;
    this.printDate = printDate;
    this.user = user; // id de User que imprimió
    this.reprintReason = reprintReason; // obligatorio solo si es reimpresión
    this.createdAt = createdAt;
  }
}
