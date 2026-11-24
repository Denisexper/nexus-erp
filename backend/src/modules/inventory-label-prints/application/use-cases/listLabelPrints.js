import { InventoryLotNotFoundForLabelError } from '../../domain/errors.js';

export class ListInventoryLabelPrintsUseCase {
  constructor(inventoryLabelPrintRepository, inventoryRepository) {
    this.inventoryLabelPrintRepository = inventoryLabelPrintRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(lotId, companyId) {
    const lot = await this.inventoryRepository.findLotById(lotId, companyId);
    if (!lot) throw new InventoryLotNotFoundForLabelError();
    return this.inventoryLabelPrintRepository.findByLot(lotId);
  }
}
