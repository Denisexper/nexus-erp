import { BranchNotFoundError } from '../../domain/errors.js';

// Simétrico a DeactivateBranchUseCase: reactivar una sucursal reactiva sus
// almacenes (y, en cascada, las ubicaciones de esos almacenes vía
// ActivateWarehouseUseCase).
export class ActivateBranchUseCase {
  constructor(branchRepository, warehouseRepository, activateWarehouseUseCase) {
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.activateWarehouseUseCase = activateWarehouseUseCase;
  }

  async execute(id, companyId) {
    const branch = await this.branchRepository.findById(id, companyId);
    if (!branch) throw new BranchNotFoundError();

    const updated = await this.branchRepository.update(id, { isActive: true });

    const { items: warehouses } = await this.warehouseRepository.findAll({ branch: id, isActive: false, limit: 10000 });
    for (const warehouse of warehouses) {
      await this.activateWarehouseUseCase.execute(warehouse.id, companyId);
    }

    return updated;
  }
}
