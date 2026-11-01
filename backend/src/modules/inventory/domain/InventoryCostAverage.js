// Saldo valorizado por (company, product) — costo promedio ponderado GLOBAL,
// no por almacén (RN-INV-013). Único por (company, product).
export class InventoryCostAverage {
  constructor({ id, company, product, quantityOnHand = 0, inventoryValue = 0, averageUnitCost = 0, updatedAt }) {
    this.id = id;
    this.company = company;
    this.product = product;
    this.quantityOnHand = quantityOnHand;
    this.inventoryValue = inventoryValue;
    this.averageUnitCost = averageUnitCost;
    this.updatedAt = updatedAt;
  }
}
