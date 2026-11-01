export class ListTransfersUseCase {
  constructor(inventoryTransferRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
  }

  async execute({ companyId, status, page = 1, limit = 10 }) {
    return this.inventoryTransferRepository.findAll({ company: companyId, status, page, limit });
  }
}
