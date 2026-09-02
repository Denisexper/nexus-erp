import {
  InvalidProductIdError,
  ProductNotFoundError,
  SubCategoryNotFoundForProductError,
  UnitNotFoundForProductError,
  InvalidPurchaseUnitTypeError,
  InvalidSaleUnitTypeError,
  DuplicateInternalCodeError,
  DuplicateSkuError,
} from '../../domain/errors.js';

const toProductDTO = (product) => ({
  _id: product.id,
  id: product.id,
  company: product.company,
  subCategory: product.subCategory,
  category: product.category,
  purchaseUnit: product.purchaseUnit,
  saleUnit: product.saleUnit,
  uuid: product.uuid,
  internalCode: product.internalCode,
  originalCode: product.originalCode,
  sku: product.sku,
  name: product.name,
  size: product.size,
  dimensions: product.dimensions,
  description: product.description,
  presentation: product.presentation,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const PRODUCT_FIELDS = [
  'subCategory',
  'purchaseUnit',
  'saleUnit',
  'internalCode',
  'originalCode',
  'sku',
  'name',
  'size',
  'dimensions',
  'description',
  'presentation',
];

export class ProductController {
  constructor({ listProducts, getProductById, createProduct, updateProduct, activateProduct, deactivateProduct }) {
    this.listProductsUseCase = listProducts;
    this.getProductByIdUseCase = getProductById;
    this.createProductUseCase = createProduct;
    this.updateProductUseCase = updateProduct;
    this.activateProductUseCase = activateProduct;
    this.deactivateProductUseCase = deactivateProduct;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidProductIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof ProductNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof SubCategoryNotFoundForProductError) return res.status(400).json({ msj: error.message });
    if (error instanceof UnitNotFoundForProductError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidPurchaseUnitTypeError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidSaleUnitTypeError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateInternalCodeError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateSkuError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, subCategory, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listProductsUseCase.execute({
        search,
        companyId: req.user.companyId,
        subCategory,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de productos vacia' : 'Productos obtenidos correctamente',
        total: result.total,
        data: result.items.map(toProductDTO),
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalRecords: result.total,
          limit: result.limit,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo productos');
    }
  };

  getOne = async (req, res) => {
    try {
      const product = await this.getProductByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Producto encontrado', data: toProductDTO(product) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo producto');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, PRODUCT_FIELDS);
      const product = await this.createProductUseCase.execute({ ...data, company: req.user.companyId });
      res.status(201).json({ msj: 'Producto creado exitosamente', newProduct: toProductDTO(product) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando producto');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, PRODUCT_FIELDS);
      const product = await this.updateProductUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Producto actualizado correctamente', product: toProductDTO(product) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando producto');
    }
  };

  activate = async (req, res) => {
    try {
      const product = await this.activateProductUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Producto activado correctamente', product: toProductDTO(product) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el producto');
    }
  };

  deactivate = async (req, res) => {
    try {
      const product = await this.deactivateProductUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Producto desactivado correctamente', product: toProductDTO(product) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el producto');
    }
  };
}
