import { ProductNotFoundForImageError } from '../../domain/errors.js';

export class ListProductImagesUseCase {
  constructor(productImageRepository, productRepository) {
    this.productImageRepository = productImageRepository;
    this.productRepository = productRepository;
  }

  async execute(productId, { isActive, companyId } = {}) {
    const product = await this.productRepository.findById(productId, companyId);
    if (!product) throw new ProductNotFoundForImageError();

    // RN-PRO-017: por defecto la galería solo muestra imágenes activas.
    const filter = { isActive: isActive === undefined ? true : isActive };
    return this.productImageRepository.findAllByProduct(productId, filter);
  }
}
