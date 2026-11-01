import { InventoryLotNotFoundError } from '../../domain/errors.js';

export class GetInventoryLotByIdUseCase {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async execute(id, companyId) {
    const lot = await this.inventoryRepository.findLotById(id, companyId);
    if (!lot) throw new InventoryLotNotFoundError();
    return lot;
  }
}
