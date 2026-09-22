import { BranchNotFoundError } from '../../domain/errors.js';

// RN-BRA-004: una sucursal inactiva no genera transacciones nuevas. Como
// consecuencia, sus almacenes también se desactivan (y, en cascada, las
// ubicaciones de esos almacenes vía DeactivateWarehouseUseCase).
export class DeactivateBranchUseCase {
  constructor(branchRepository, warehouseRepository, deactivateWarehouseUseCase) {
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.deactivateWarehouseUseCase = deactivateWarehouseUseCase;
  }

  async execute(id, companyId) {
    const branch = await this.branchRepository.findById(id, companyId);
    if (!branch) throw new BranchNotFoundError();

    const updated = await this.branchRepository.update(id, { isActive: false });

    const { items: warehouses } = await this.warehouseRepository.findAll({ branch: id, isActive: true, limit: 10000 });
    for (const warehouse of warehouses) {
      await this.deactivateWarehouseUseCase.execute(warehouse.id, companyId);
    }

    return updated;
  }
}
