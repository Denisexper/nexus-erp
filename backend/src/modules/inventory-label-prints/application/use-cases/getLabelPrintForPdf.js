import { InventoryLabelPrintNotFoundError, InventoryLotNotFoundForLabelError } from '../../domain/errors.js';

// Trae un registro de impresión ya existente junto con su lote, para poder
// (re)generar el PDF de etiquetas sin crear un nuevo registro de impresión.
// El scoping por company lo hace findLotById: si el lote no es de esta
// company, se trata igual que "no existe".
export class GetInventoryLabelPrintForPdfUseCase {
  constructor(inventoryLabelPrintRepository, inventoryRepository) {
    this.inventoryLabelPrintRepository = inventoryLabelPrintRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(labelPrintId, companyId) {
    const labelPrint = await this.inventoryLabelPrintRepository.findById(labelPrintId);
    if (!labelPrint) throw new InventoryLabelPrintNotFoundError();

    const lot = await this.inventoryRepository.findLotById(labelPrint.inventoryLot, companyId);
    if (!lot) throw new InventoryLotNotFoundForLabelError();

    return { labelPrint, lot };
  }
}
