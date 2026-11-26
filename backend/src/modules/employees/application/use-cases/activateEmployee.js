import { EmployeeNotFoundError } from '../../domain/errors.js';

export class ActivateEmployeeUseCase {
  constructor(employeeRepository, branchRepository) {
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const employee = await this.employeeRepository.findById(id, branchIds);
    if (!employee) throw new EmployeeNotFoundError();

    return this.employeeRepository.update(id, { isActive: true });
  }
}
