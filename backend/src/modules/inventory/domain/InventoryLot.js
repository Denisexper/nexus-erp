// Un lote se crea automático al confirmar una recepción de compra
// (createPurchase.js) y arranca 'pending_placement': existe pero todavía no
// cuenta como stock real en ninguna ubicación (ERS 6.9.12). Solo cuando se
// asigna a una ubicación física (assignLotToLocation) pasa a
// 'partially_placed'/'placed' y recién ahí genera movimiento + saldo + costo
// promedio. quantityAssigned es denormalizado (no está en el texto literal
// del ERS) para no tener que agregar inventory_location_details en cada
// validación de cantidad disponible.
export const INVENTORY_LOT_STATUSES = ['pending_placement', 'partially_placed', 'placed', 'cancelled'];

export class InventoryLot {
  constructor({
    id,
    company,
    lotCode,
    product,
    purchaseDetail,
    receivedAt,
    quantityReceived,
    quantityAssigned = 0,
    unitCost,
    totalCost,
    status = 'pending_placement',
    createdAt,
  }) {
    this.id = id;
    this.company = company; // id de Company (no está en el ERS, pero el lote necesita tenant scoping directo: purchaseDetail no es consultable por company sin un join extra)
    this.lotCode = lotCode; // ej: LOT-00001, único por company
    this.product = product; // id de Product, o subdocumento poblado
    this.purchaseDetail = purchaseDetail; // id de PurchaseDetail (la recepción real que originó el lote)
    this.receivedAt = receivedAt;
    this.quantityReceived = quantityReceived;
    this.quantityAssigned = quantityAssigned; // suma de lo ya colocado en ubicaciones
    this.unitCost = unitCost; // costo de purchaseDetail.unitPrice, corregido por retaceo si aplica y el lote sigue pending_placement
    this.totalCost = totalCost;
    this.status = status;
    this.createdAt = createdAt;
  }
}
