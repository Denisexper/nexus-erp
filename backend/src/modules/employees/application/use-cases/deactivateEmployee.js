import { EmployeeNotFoundError } from '../../domain/errors.js';

// A diferencia de branches/warehouses, desactivar un empleado no cascada a
// nada: un vehículo puede quedar con un conductor inactivo asignado (no se le
// quita de oficio), simplemente no se le podrá asignar a un vehículo *nuevo*
// mientras esté inactivo (ver CreateVehicleUseCase).
export class DeactivateEmployeeUseCase {
  constructor(employeeRepository, branchRepository) {
    this.employeeRepository = employeeRepository;
    this.branchRepository = branchRepository;
  }

  async execute(id, companyId) {
    const branchIds = companyId ? await this.branchRepository.findIdsByCompany(companyId) : undefined;
    const employee = await this.employeeRepository.findById(id, branchIds);
    if (!employee) throw new EmployeeNotFoundError();

    return this.employeeRepository.update(id, { isActive: false });
  }
}
