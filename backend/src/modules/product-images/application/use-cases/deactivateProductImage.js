import { ProductImageNotFoundError } from '../../domain/errors.js';

export class DeactivateProductImageUseCase {
  constructor(productImageRepository) {
    this.productImageRepository = productImageRepository;
  }

  async execute(id) {
    const image = await this.productImageRepository.findById(id);
    if (!image) throw new ProductImageNotFoundError();

    return this.productImageRepository.update(id, { isActive: false });
  }
}
