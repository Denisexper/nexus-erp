export class ListProductImageCoversUseCase {
  constructor(productImageRepository, productRepository) {
    this.productImageRepository = productImageRepository;
    this.productRepository = productRepository;
  }

  async execute(productIds = [], companyId) {
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) return [];

    // Filtra a solo los productos de la company del usuario: la lista de
    // ids la manda el cliente, así que sin esto se podrían pedir portadas
    // de productos ajenos adivinando/probando ids.
    const companyProductIds = new Set(await this.productRepository.findIdsByCompany(companyId));
    const ownIds = uniqueIds.filter((id) => companyProductIds.has(id));
    if (ownIds.length === 0) return [];

    return this.productImageRepository.findCoversByProducts(ownIds);
  }
}
