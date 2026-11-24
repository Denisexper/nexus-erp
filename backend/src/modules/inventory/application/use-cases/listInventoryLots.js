export class ListInventoryLotsUseCase {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async execute({ companyId, status, product, page = 1, limit = 10 }) {
    return this.inventoryRepository.findLots({ company: companyId, status, product, page, limit });
  }
}
