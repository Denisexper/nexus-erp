import { WarehouseNotFoundError } from '../../domain/errors.js';

// RN-EMP-005/RN-BRA-004 no cubren explícitamente Almacén->Ubicación, pero por
// consistencia desactivar un almacén también desactiva sus ubicaciones. Las
// que tengan existencias (RN-WHS-007) se dejan activas: nunca se puede llegar
// a una ubicación inactiva con stock, así que no queda inventario "atrapado"
// detrás de un almacén desactivado.
export class DeactivateWarehouseUseCase {
  constructor(warehouseRepository, branchRepository, locationRepository, inventoryRepository) {
    this.warehouseRepository = warehouseRepository;
    this.branchRepository = branchRepository;
    this.locationRepository = locationRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async execute(id, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const warehouse = await this.warehouseRepository.findById(id, branchIds);
    if (!warehouse) throw new WarehouseNotFoundError();

    const updated = await this.warehouseRepository.update(id, { isActive: false });

    const { items: locations } = await this.locationRepository.findAll({ warehouse: id, isActive: true, limit: 10000 });
    for (const location of locations) {
      const totalStock = await this.inventoryRepository.getLocationStock(location.id);
      if (totalStock > 0) continue;
      await this.locationRepository.update(location.id, { isActive: false });
    }

    return updated;
  }
}
