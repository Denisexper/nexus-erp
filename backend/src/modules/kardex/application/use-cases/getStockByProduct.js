import { ProductNotFoundForKardexError } from '../../domain/errors.js';
import { resolveLocationIdsForCompany } from '#shared/lib/tenantScope.js';

export class GetStockByProductUseCase {
  constructor(kardexRepository, productRepository, branchRepository, warehouseRepository, locationRepository) {
    this.kardexRepository = kardexRepository;
    this.productRepository = productRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.locationRepository = locationRepository;
  }

  async execute(productId, companyId) {
    const product = await this.productRepository.findById(productId, companyId);
    if (!product) throw new ProductNotFoundForKardexError();

    const locationIds = await resolveLocationIdsForCompany(
      companyId, this.branchRepository, this.warehouseRepository, this.locationRepository,
    );
    return this.kardexRepository.getStockByProduct(productId, locationIds);
  }
}
