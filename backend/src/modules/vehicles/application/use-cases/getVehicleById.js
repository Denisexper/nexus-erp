import { resolveEmployeeIdsForCompany } from '#shared/lib/tenantScope.js';
import { VehicleNotFoundError } from '../../domain/errors.js';

export class GetVehicleByIdUseCase {
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
    return vehicle;
  }
}
