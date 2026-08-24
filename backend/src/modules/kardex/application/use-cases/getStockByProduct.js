import { ProductNotFoundForKardexError } from '../../domain/errors.js';

export class GetStockByProductUseCase {
  constructor(kardexRepository, productRepository) {
    this.kardexRepository = kardexRepository;
    this.productRepository = productRepository;
  }

  async execute(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundForKardexError();

    return this.kardexRepository.getStockByProduct(productId);
  }
}
