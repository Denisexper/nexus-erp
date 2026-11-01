import { InventoryTransferNotFoundError } from '../../domain/errors.js';

export class GetTransferByIdUseCase {
  constructor(inventoryTransferRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
  }

  async execute(id, companyId) {
    const transfer = await this.inventoryTransferRepository.findById(id, companyId);
    if (!transfer) throw new InventoryTransferNotFoundError();
    return transfer;
  }
}
