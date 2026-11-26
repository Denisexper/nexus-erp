import { Employee } from '../../domain/Employee.js';
import {
  BranchNotFoundForEmployeeError,
  InactiveBranchForEmployeeError,
  DuplicateEmployeeDuiError,
  InvalidDuiError,
} from '../../domain/errors.js';

const DUI_REGEX = /^\d{8}-\d$/;

export class CreateEmployeeUseCase {
  constructor(employeeRepository, branchRepository) {
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(data, companyId) {
    // Todo empleado debe pertenecer a una sucursal, y esa sucursal tiene que
    // ser de la company del usuario (mismo criterio que CreateWarehouseUseCase).
    const branch = await this.branchRepository.findById(data.branch, companyId);
    if (!branch) throw new BranchNotFoundForEmployeeError();
    if (!branch.isActive) throw new InactiveBranchForEmployeeError();

    if (!DUI_REGEX.test(data.dui)) throw new InvalidDuiError();

    const duiTaken = await this.employeeRepository.findByDui(data.dui);
    if (duiTaken) throw new DuplicateEmployeeDuiError();

    const employee = new Employee(data);
    return this.employeeRepository.create(employee);
  }
}
