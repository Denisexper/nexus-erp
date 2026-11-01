const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Se llama desde createPurchase.js justo después de confirmar la recepción
// (ERS 6.9.12): un lote por cada línea realmente recibida, con
// unitCost = purchaseDetail.unitPrice (el único costo conocido en ese
// momento — si la compra lleva retaceo, createRetaceo.js corrige este valor
// más adelante mientras el lote siga 'pending_placement').
export class CreateInventoryLotFromPurchaseUseCase {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async execute(purchase, company) {
    const details = purchase.details || [];
    if (details.length === 0) return [];

    const nextCode = await this.inventoryRepository.getNextLotCode(company);
    const nextNumber = parseInt(nextCode.split('-')[1], 10);

    const lots = details.map((detail, index) => {
      const quantity = detail.quantityReceived;
      const unitCost = detail.unitPrice;
      return {
        company,
        lotCode: `LOT-${String(nextNumber + index).padStart(5, '0')}`,
        product: detail.product?._id || detail.product,
        purchaseDetail: detail.id,
        receivedAt: purchase.purchaseDate || new Date(),
        quantityReceived: quantity,
        unitCost,
        totalCost: round2(unitCost * quantity),
      };
    });

    return this.inventoryRepository.createLotsFromPurchase(lots);
  }
}
