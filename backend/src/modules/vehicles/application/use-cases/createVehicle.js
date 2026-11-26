import { resolveBranchIdsForCompany } from '#shared/lib/tenantScope.js';
import { Vehicle } from '../../domain/Vehicle.js';
import {
  EmployeeNotFoundForVehicleError,
  InactiveEmployeeForVehicleError,
  DuplicateVehiclePlateError,
  InvalidVehicleYearError,
} from '../../domain/errors.js';

const MIN_YEAR = 1980;

export class CreateVehicleUseCase {
  constructor(vehicleRepository, employeeRepository, branchRepository) {
    this.vehicleRepository = vehicleRepository;
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(data, companyId) {
    // Todo vehículo debe tener un empleado responsable, y ese empleado tiene
    // que ser de la company del usuario (mismo criterio que CreateEmployeeUseCase
    // con branch, un salto más allá: vehicle -> employee -> branch -> company).
    const branchIds = await resolveBranchIdsForCompany(companyId, this.branchRepository);
    const employee = await this.employeeRepository.findById(data.employee, branchIds);
    if (!employee) throw new EmployeeNotFoundForVehicleError();
    if (!employee.isActive) throw new InactiveEmployeeForVehicleError();

    const currentYear = new Date().getFullYear();
    const year = Number(data.year);
    if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear + 1) {
      throw new InvalidVehicleYearError();
    }

    const plateTaken = await this.vehicleRepository.findByPlate(data.plate);
    if (plateTaken) throw new DuplicateVehiclePlateError();

    const vehicle = new Vehicle({ ...data, year });
    return this.vehicleRepository.create(vehicle);
  }
}
