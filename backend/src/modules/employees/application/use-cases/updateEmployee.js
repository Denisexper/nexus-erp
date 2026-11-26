import { EmployeeNotFoundError, DuplicateEmployeeDuiError, InvalidDuiError } from '../../domain/errors.js';

const DUI_REGEX = /^\d{8}-\d$/;

export class UpdateEmployeeUseCase {
  constructor(employeeRepository, branchRepository) {
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, changes, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const employee = await this.employeeRepository.findById(id, branchIds);
    if (!employee) throw new EmployeeNotFoundError();

    if (changes.dui && changes.dui !== employee.dui) {
      if (!DUI_REGEX.test(changes.dui)) throw new InvalidDuiError();
      const duiTaken = await this.employeeRepository.findByDui(changes.dui);
      if (duiTaken) throw new DuplicateEmployeeDuiError();
    }

    return this.employeeRepository.update(id, changes);
  }
}
