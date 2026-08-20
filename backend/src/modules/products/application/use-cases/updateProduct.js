import {
  ProductNotFoundError,
  SubCategoryNotFoundForProductError,
  UnitNotFoundForProductError,
  InvalidPurchaseUnitTypeError,
  InvalidSaleUnitTypeError,
  DuplicateInternalCodeError,
  DuplicateSkuError,
} from '../../domain/errors.js';

export class UpdateProductUseCase {
  constructor(productRepository, subCategoryRepository, unitRepository) {
    this.productRepository = productRepository;
    this.subCategoryRepository = subCategoryRepository;
    this.unitRepository = unitRepository;
  }

  async execute(id, changes) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new ProductNotFoundError();

    if (changes.internalCode && changes.internalCode !== product.internalCode) {
      const internalCodeTaken = await this.productRepository.findByInternalCode(changes.internalCode);
      if (internalCodeTaken) throw new DuplicateInternalCodeError();
    }

    if (changes.sku && changes.sku !== product.sku) {
      const skuTaken = await this.productRepository.findBySku(changes.sku);
      if (skuTaken) throw new DuplicateSkuError();
    }

    if (changes.subCategory) {
      const subCategory = await this.subCategoryRepository.findById(changes.subCategory);
      if (!subCategory) throw new SubCategoryNotFoundForProductError();
      // Recalcular category denormalizada para que no quede desincronizada
      // con la nueva sub-categoría.
      changes.category = subCategory.category?._id ?? subCategory.category;
    }

    // RN-PRO-008/009: purchase_unit debe ser type=purchase y sale_unit type=sale.
    if (changes.purchaseUnit) {
      const purchaseUnit = await this.unitRepository.findById(changes.purchaseUnit);
      if (!purchaseUnit) throw new UnitNotFoundForProductError();
      if (purchaseUnit.type !== 'purchase') throw new InvalidPurchaseUnitTypeError();
    }

    if (changes.saleUnit) {
      const saleUnit = await this.unitRepository.findById(changes.saleUnit);
      if (!saleUnit) throw new UnitNotFoundForProductError();
      if (saleUnit.type !== 'sale') throw new InvalidSaleUnitTypeError();
    }

    return this.productRepository.update(id, changes);
  }
}
