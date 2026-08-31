import { ProductImageNotFoundError } from '../../domain/errors.js';

export class DeactivateProductImageUseCase {
  constructor(productImageRepository, productRepository) {
    this.productImageRepository = productImageRepository;
    this.productRepository = productRepository;
  }

  async execute(id, companyId) {
    const image = await this.productImageRepository.findById(id);
    if (!image) throw new ProductImageNotFoundError();

    // ProductImage no tiene company propio: se valida vía el producto dueño
    // (mismo criterio que supplierContact -> supplier).
    const product = await this.productRepository.findById(image.productId, companyId);
    if (!product) throw new ProductImageNotFoundError();

    return this.productImageRepository.update(id, { isActive: false });
  }
}
