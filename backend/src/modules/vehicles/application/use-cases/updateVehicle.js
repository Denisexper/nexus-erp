import { resolveEmployeeIdsForCompany, resolveBranchIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  VehicleNotFoundError,
  EmployeeNotFoundForVehicleError,
  InactiveEmployeeForVehicleError,
  DuplicateVehiclePlateError,
  InvalidVehicleYearError,
} from '../../domain/errors.js';

const MIN_YEAR = 1980;

export class UpdateVehicleUseCase {
  constructor(vehicleRepository, employeeRepository, branchRepository) {
    this.vehicleRepository = vehicleRepository;
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, changes, companyId) {
    const employeeIds = companyId
      ? await resolveEmployeeIdsForCompany(companyId, this.branchRepository, this.employeeRepository)
      : undefined;

    const vehicle = await this.vehicleRepository.findById(id, employeeIds);
    if (!vehicle) throw new VehicleNotFoundError();

    if (changes.employee && changes.employee !== vehicle.employee) {
      const branchIds = await resolveBranchIdsForCompany(companyId, this.branchRepository);
      const employee = await this.employeeRepository.findById(changes.employee, branchIds);
      if (!employee) throw new EmployeeNotFoundForVehicleError();
      if (!employee.isActive) throw new InactiveEmployeeForVehicleError();
    }

    if (changes.plate && changes.plate !== vehicle.plate) {
      const plateTaken = await this.vehicleRepository.findByPlate(changes.plate);
      if (plateTaken) throw new DuplicateVehiclePlateError();
    }

    if (changes.year !== undefined) {
      const currentYear = new Date().getFullYear();
      const year = Number(changes.year);
      if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear + 1) {
        throw new InvalidVehicleYearError();
      }
      changes.year = year;
    }

    return this.vehicleRepository.update(id, changes);
  }
}
