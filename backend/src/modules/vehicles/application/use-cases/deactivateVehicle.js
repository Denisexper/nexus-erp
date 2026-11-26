import { resolveEmployeeIdsForCompany } from '#shared/lib/tenantScope.js';
import { VehicleNotFoundError } from '../../domain/errors.js';

// A diferencia de branches/warehouses, desactivar un vehículo no cascada: un
// traslado ya en curso con este vehículo no se ve afectado (eso lo maneja la
// Fase 3 — máquina de estados de traslados). Solo evita que se le asignen
// traslados *nuevos* mientras esté inactivo.
export class DeactivateVehicleUseCase {
  constructor(vehicleRepository, employeeRepository, branchRepository) {
    this.vehicleRepository = vehicleRepository;
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, companyId) {
    const employeeIds = companyId
      ? await resolveEmployeeIdsForCompany(companyId, this.branchRepository, this.employeeRepository)
      : undefined;
    const vehicle = await this.vehicleRepository.findById(id, employeeIds);
    if (!vehicle) throw new VehicleNotFoundError();

    return this.vehicleRepository.update(id, { isActive: false });
  }
}
