import { extractGeoId } from '#shared/lib/geoValidation.js';
import {
  WarehouseNotFoundError,
  WarehouseCategoryNotFoundForWarehouseError,
  DuplicateWarehouseNameError,
} from '../../domain/errors.js';

export class UpdateWarehouseUseCase {
  constructor(warehouseRepository, warehouseCategoryRepository, branchRepository) {
    this.warehouseRepository = warehouseRepository;
    this.warehouseCategoryRepository = warehouseCategoryRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, changes, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const warehouse = await this.warehouseRepository.findById(id, branchIds);
    if (!warehouse) throw new WarehouseNotFoundError();

    if (changes.name && changes.name !== warehouse.name) {
      const nameTaken = await this.warehouseRepository.findByNameAndBranch(changes.name, extractGeoId(warehouse.branch));
      if (nameTaken) throw new DuplicateWarehouseNameError();
    }

    if (changes.warehouseCategory) {
      const category = await this.warehouseCategoryRepository.findById(changes.warehouseCategory);
      if (!category) throw new WarehouseCategoryNotFoundForWarehouseError();
    }

    return this.warehouseRepository.update(id, changes);
  }
}
