import { randomUUID } from 'node:crypto';
import { ProductImage } from '../../domain/ProductImage.js';
import { ProductNotFoundForImageError, MissingImageFileError } from '../../domain/errors.js';

export class UploadProductImageUseCase {
  constructor(productImageRepository, productRepository) {
    this.productImageRepository = productImageRepository;
    this.productRepository = productRepository;
  }

  async execute({ productId, relativePath, companyId }) {
    if (!relativePath) throw new MissingImageFileError();

    // RN-PRO-016: toda imagen debe estar asociada a un producto existente,
    // y ese producto tiene que ser de la company del usuario (si no,
    // cualquiera con permiso de subir imágenes podría colgarle una a un
    // producto ajeno).
    const product = await this.productRepository.findById(productId, companyId);
    if (!product) throw new ProductNotFoundForImageError();

    const productImage = new ProductImage({
      uuid: randomUUID(),
      productId,
      path: relativePath,
    });

    return this.productImageRepository.create(productImage);
  }
}
