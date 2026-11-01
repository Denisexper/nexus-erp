// Libro contable del inventario (ERS 6.9.7, fuente del Kardex). Append-only:
// un movimiento confirmado nunca se edita ni se borra (RN-INV-007); una
// corrección es un movimiento nuevo compensatorio.
export const INVENTORY_MOVEMENT_TYPES = ['entry', 'exit', 'transfer', 'return', 'adjustment'];

// Documento de origen del movimiento (reference_type/reference_id del ERS,
// referencia polimórfica validada por la app, no FK estricta).
export const INVENTORY_MOVEMENT_REFERENCE_TYPES = ['purchase', 'sale', 'transfer', 'return', 'adjustment'];

export class InventoryMovement {
  constructor({
    id,
    product,
    inventoryLot,
    warehouse,
    location,
    movementType,
    movementDate,
    quantityIn = 0,
    quantityOut = 0,
    unitCost,
    totalCost,
    referenceType,
    referenceId,
    user,
    createdAt,
  }) {
    this.id = id;
    this.product = product;
    this.inventoryLot = inventoryLot;
    this.warehouse = warehouse;
    this.location = location;
    this.movementType = movementType;
    this.movementDate = movementDate;
    this.quantityIn = quantityIn;
    this.quantityOut = quantityOut;
    this.unitCost = unitCost;
    this.totalCost = totalCost;
    this.referenceType = referenceType;
    this.referenceId = referenceId;
    this.user = user;
    this.createdAt = createdAt;
  }
}
