export class KardexMovement {
  constructor({
    id,
    product,
    location,
    type,
    reason,
    quantity,
    notes,
    transferRef,
    createdAt,
  }) {
    this.id = id;
    this.product = product; // id de Product, o subdocumento poblado
    this.location = location; // id de Location, o subdocumento poblado
    this.type = type; // 'in' | 'out'
    this.reason = reason; // 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'initial'
    this.quantity = quantity;
    this.notes = notes;
    this.transferRef = transferRef; // enlaza los dos movimientos (out+in) de una misma transferencia
    this.createdAt = createdAt;
  }
}
