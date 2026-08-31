import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/Product.js';
import { resolveCategoryIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  SubCategoryNotFoundForProductError,
  UnitNotFoundForProductError,
  InvalidPurchaseUnitTypeError,
  InvalidSaleUnitTypeError,
  DuplicateInternalCodeError,
  DuplicateSkuError,
} from '../../domain/errors.js';

export class CreateProductUseCase {
  constructor(productRepository, subCategoryRepository, unitRepository, categoryRepository) {
    this.productRepository = productRepository;
    this.subCategoryRepository = subCategoryRepository;
    this.unitRepository = unitRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(data) {
    // La sub-categoría tiene que ser de la company del usuario (si no,
    // cualquiera con permiso de crear productos podría colgarle uno a una
    // sub-categoría ajena), igual que warehouse valida su branch.
    const categoryIds = await resolveCategoryIdsForCompany(data.company, this.categoryRepository);
    const subCategory = await this.subCategoryRepository.findById(data.subCategory, categoryIds);
    if (!subCategory) throw new SubCategoryNotFoundForProductError();

    // RN-PRO-006/007: unidad de compra y de venta son FKs independientes,
    // también deben ser de la company del usuario.
    const [purchaseUnit, saleUnit] = await Promise.all([
      this.unitRepository.findById(data.purchaseUnit, data.company),
      this.unitRepository.findById(data.saleUnit, data.company),
    ]);
    if (!purchaseUnit || !saleUnit) throw new UnitNotFoundForProductError();

    // RN-PRO-008/009: purchase_unit debe ser type=purchase y sale_unit type=sale.
    if (purchaseUnit.type !== 'purchase') throw new InvalidPurchaseUnitTypeError();
    if (saleUnit.type !== 'sale') throw new InvalidSaleUnitTypeError();

    // RN-PRO-005: código interno único (dentro de la empresa).
    const internalCodeTaken = await this.productRepository.findByInternalCodeAndCompany(data.internalCode, data.company);
    if (internalCodeTaken) throw new DuplicateInternalCodeError();

    // RN-PRO-004: SKU único (cuando se proporciona, dentro de la empresa).
    if (data.sku) {
      const skuTaken = await this.productRepository.findBySkuAndCompany(data.sku, data.company);
      if (skuTaken) throw new DuplicateSkuError();
    }

    // category se denormaliza desde subCategory.category (ERS v0.7): nunca
    // la manda el cliente, así queda garantizado que coincide con la
    // sub-categoría elegida (mismo criterio que uuid, autogenerado acá).
    const product = new Product({ ...data, category: subCategory.category?._id ?? subCategory.category, uuid: randomUUID() });
    return this.productRepository.create(product);
  }
}
