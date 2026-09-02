import { ProductNotFoundError } from '../../domain/errors.js';

export class DeactivateProductUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(id, companyId) {
    const product = await this.productRepository.findById(id, companyId);
    if (!product) throw new ProductNotFoundError();

    return this.productRepository.update(id, { isActive: false });
  }
}
