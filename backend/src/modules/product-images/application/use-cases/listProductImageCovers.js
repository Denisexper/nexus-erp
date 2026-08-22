export class ListProductImageCoversUseCase {
  constructor(productImageRepository) {
    this.productImageRepository = productImageRepository;
  }

  async execute(productIds = []) {
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) return [];

    return this.productImageRepository.findCoversByProducts(uniqueIds);
  }
}
