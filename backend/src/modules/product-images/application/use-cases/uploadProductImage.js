import { randomUUID } from 'node:crypto';
import { ProductImage } from '../../domain/ProductImage.js';
import { ProductNotFoundForImageError, MissingImageFileError } from '../../domain/errors.js';

export class UploadProductImageUseCase {
  constructor(productImageRepository, productRepository) {
    this.productImageRepository = productImageRepository;
    this.productRepository = productRepository;
  }

  async execute({ productId, relativePath }) {
    if (!relativePath) throw new MissingImageFileError();

    // RN-PRO-016: toda imagen debe estar asociada a un producto existente.
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundForImageError();

    const productImage = new ProductImage({
      uuid: randomUUID(),
      productId,
      path: relativePath,
    });

    return this.productImageRepository.create(productImage);
  }
}
