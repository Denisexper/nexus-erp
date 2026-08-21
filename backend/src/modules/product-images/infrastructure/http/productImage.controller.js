import multer from 'multer';
import {
  InvalidProductImageIdError,
  ProductImageNotFoundError,
  ProductNotFoundForImageError,
  MissingImageFileError,
} from '../../domain/errors.js';

const toProductImageDTO = (image) => ({
  _id: image.id,
  id: image.id,
  productId: image.productId,
  uuid: image.uuid,
  path: image.path,
  isActive: image.isActive,
  createdAt: image.createdAt,
  updatedAt: image.updatedAt,
});

export class ProductImageController {
  constructor({ uploadProductImage, listProductImages, activateProductImage, deactivateProductImage }) {
    this.uploadProductImageUseCase = uploadProductImage;
    this.listProductImagesUseCase = listProductImages;
    this.activateProductImageUseCase = activateProductImage;
    this.deactivateProductImageUseCase = deactivateProductImage;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof multer.MulterError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidProductImageIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof ProductImageNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof ProductNotFoundForImageError) return res.status(400).json({ msj: error.message });
    if (error instanceof MissingImageFileError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { isActive } = req.query;
      const images = await this.listProductImagesUseCase.execute(req.params.productId, { isActive });

      res.status(200).json({
        msj: images.length === 0 ? 'lista de imágenes vacia' : 'Imágenes obtenidas correctamente',
        data: images.map(toProductImageDTO),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo imágenes');
    }
  };

  upload = async (req, res) => {
    try {
      if (req.uploadError) throw req.uploadError;
      const relativePath = req.file ? `products/${req.file.filename}` : null;
      const image = await this.uploadProductImageUseCase.execute({
        productId: req.params.productId,
        relativePath,
      });
      res.status(201).json({ msj: 'Imagen cargada exitosamente', newProductImage: toProductImageDTO(image) });
    } catch (error) {
      this.#handleError(res, error, 'Error cargando imagen');
    }
  };

  activate = async (req, res) => {
    try {
      const image = await this.activateProductImageUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Imagen activada correctamente', productImage: toProductImageDTO(image) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la imagen');
    }
  };

  deactivate = async (req, res) => {
    try {
      const image = await this.deactivateProductImageUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Imagen desactivada correctamente', productImage: toProductImageDTO(image) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la imagen');
    }
  };
}
