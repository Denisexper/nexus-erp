import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/Product.js';
import {
  SubCategoryNotFoundForProductError,
  UnitNotFoundForProductError,
  InvalidPurchaseUnitTypeError,
  InvalidSaleUnitTypeError,
  DuplicateInternalCodeError,
  DuplicateSkuError,
} from '../../domain/errors.js';

export class CreateProductUseCase {
  constructor(productRepository, subCategoryRepository, unitRepository) {
    this.productRepository = productRepository;
    this.subCategoryRepository = subCategoryRepository;
    this.unitRepository = unitRepository;
  }

  async execute(data) {
    const subCategory = await this.subCategoryRepository.findById(data.subCategory);
    if (!subCategory) throw new SubCategoryNotFoundForProductError();

    // RN-PRO-006/007: unidad de compra y de venta son FKs independientes.
    const [purchaseUnit, saleUnit] = await Promise.all([
      this.unitRepository.findById(data.purchaseUnit),
      this.unitRepository.findById(data.saleUnit),
    ]);
    if (!purchaseUnit || !saleUnit) throw new UnitNotFoundForProductError();

    // RN-PRO-008/009: purchase_unit debe ser type=purchase y sale_unit type=sale.
    if (purchaseUnit.type !== 'purchase') throw new InvalidPurchaseUnitTypeError();
    if (saleUnit.type !== 'sale') throw new InvalidSaleUnitTypeError();

    // RN-PRO-005: código interno único.
    const internalCodeTaken = await this.productRepository.findByInternalCode(data.internalCode);
    if (internalCodeTaken) throw new DuplicateInternalCodeError();

    // RN-PRO-004: SKU único (cuando se proporciona).
    if (data.sku) {
      const skuTaken = await this.productRepository.findBySku(data.sku);
      if (skuTaken) throw new DuplicateSkuError();
    }

    // category se denormaliza desde subCategory.category (ERS v0.7): nunca
    // la manda el cliente, así queda garantizado que coincide con la
    // sub-categoría elegida (mismo criterio que uuid, autogenerado acá).
    const product = new Product({ ...data, category: subCategory.category?._id ?? subCategory.category, uuid: randomUUID() });
    return this.productRepository.create(product);
  }
}
