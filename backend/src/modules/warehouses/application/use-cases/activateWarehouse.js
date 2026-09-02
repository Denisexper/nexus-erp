import { WarehouseNotFoundError } from '../../domain/errors.js';

export class ActivateWarehouseUseCase {
  constructor(warehouseRepository, branchRepository) {
    this.warehouseRepository = warehouseRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const warehouse = await this.warehouseRepository.findById(id, branchIds);
    if (!warehouse) throw new WarehouseNotFoundError();

    return this.warehouseRepository.update(id, { isActive: true });
  }
}
