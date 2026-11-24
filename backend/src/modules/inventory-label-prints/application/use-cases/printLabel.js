import { InventoryLabelPrint } from '../../domain/InventoryLabelPrint.js';
import { InventoryLotNotFoundForLabelError, InvalidQuantityPrintedError, ReprintReasonRequiredError } from '../../domain/errors.js';

// RN-INV-016/017 del ERS: el código de barras de la etiqueta usa
// products.internalCode (se resuelve acá vía inventoryRepository, que ya
// trae el producto poblado). Es "reimpresión" automáticamente cuando el
// lote ya tiene impresiones previas — no hay un flag que lo indique, se
// calcula solo, y recién ahí se exige el motivo.
export class PrintInventoryLabelUseCase {
  constructor(inventoryLabelPrintRepository, inventoryRepository) {
    this.inventoryLabelPrintRepository = inventoryLabelPrintRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute({ inventoryLot, quantityPrinted, reprintReason }, company, user) {
    const lot = await this.inventoryRepository.findLotById(inventoryLot, company);
    if (!lot) throw new InventoryLotNotFoundForLabelError();

    const qty = Number(quantityPrinted);
    if (!(qty > 0)) throw new InvalidQuantityPrintedError();

    const previousCount = await this.inventoryLabelPrintRepository.countByLot(lot.id);
    const isReprint = previousCount > 0;
    if (isReprint && !reprintReason) throw new ReprintReasonRequiredError();

    const labelPrint = new InventoryLabelPrint({
      inventoryLot: lot.id,
      quantityPrinted: qty,
      printDate: new Date(),
      user,
      reprintReason: isReprint ? reprintReason : undefined,
    });

    const created = await this.inventoryLabelPrintRepository.create(labelPrint);
    return { labelPrint: created, lot };
  }
}
