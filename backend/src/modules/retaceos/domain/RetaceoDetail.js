export class RetaceoDetail {
  constructor({
    id,
    retaceo,
    product,
    quantity,
    costFob,
    freightAmount = 0,
    expenseAmount = 0,
    daiAmount = 0,
    unitCost = 0,
    totalCost = 0,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.retaceo = retaceo; // id de Retaceo
    this.product = product; // id de Product, o subdocumento poblado
    this.quantity = quantity; // copiada de purchase_order_details
    this.costFob = costFob; // copiado de purchase_order_details (subtotal en FOB)
    this.freightAmount = freightAmount; // (costFob / totalFob) * retaceo.totalFreight
    this.expenseAmount = expenseAmount; // (costFob / totalFob) * retaceo.totalExpenses
    this.daiAmount = daiAmount; // (costFob / totalFob) * retaceo.totalDai
    this.unitCost = unitCost; // (costFob + freightAmount + expenseAmount + daiAmount) / quantity
    this.totalCost = totalCost; // unitCost * quantity
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
