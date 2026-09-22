import { WarehouseNotFoundError } from '../../domain/errors.js';

// Simétrico a DeactivateWarehouseUseCase: reactivar un almacén reactiva
// también las ubicaciones que quedaron inactivas por la cascada de
// desactivación (no distinguimos si una ubicación estaba inactiva por su
// cuenta antes de la cascada; reactivar todo junto es el comportamiento que
// se espera al reabrir un almacén).
export class ActivateWarehouseUseCase {
  constructor(warehouseRepository, branchRepository, locationRepository) {
    this.warehouseRepository = warehouseRepository;
    this.branchRepository = branchRepository;
    this.locationRepository = locationRepository;
  }

  async execute(id, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const warehouse = await this.warehouseRepository.findById(id, branchIds);
    if (!warehouse) throw new WarehouseNotFoundError();

    const updated = await this.warehouseRepository.update(id, { isActive: true });

    const { items: locations } = await this.locationRepository.findAll({ warehouse: id, isActive: false, limit: 10000 });
    for (const location of locations) {
      await this.locationRepository.update(location.id, { isActive: true });
    }

    return updated;
  }
}
