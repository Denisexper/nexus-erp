import {
  InvalidEmployeeIdError,
  EmployeeNotFoundError,
  BranchNotFoundForEmployeeError,
  InactiveBranchForEmployeeError,
  DuplicateEmployeeDuiError,
  InvalidDuiError,
} from '../../domain/errors.js';

const toEmployeeDTO = (employee) => ({
  _id: employee.id,
  id: employee.id,
  branch: employee.branch,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  phone: employee.phone,
  dui: employee.dui,
  position: employee.position,
  isActive: employee.isActive,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['branch', 'firstName', 'lastName', 'email', 'phone', 'dui', 'position'];
// `branch` no es editable después de creado el empleado (igual que en warehouses).
const UPDATE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'dui', 'position'];

export class EmployeeController {
  constructor({ listEmployees, getEmployeeById, createEmployee, updateEmployee, activateEmployee, deactivateEmployee }) {
    this.listEmployeesUseCase = listEmployees;
    this.getEmployeeByIdUseCase = getEmployeeById;
    this.createEmployeeUseCase = createEmployee;
    this.updateEmployeeUseCase = updateEmployee;
    this.activateEmployeeUseCase = activateEmployee;
    this.deactivateEmployeeUseCase = deactivateEmployee;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidEmployeeIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof EmployeeNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof BranchNotFoundForEmployeeError) return res.status(400).json({ msj: error.message });
    if (error instanceof InactiveBranchForEmployeeError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateEmployeeDuiError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidDuiError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, branch, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listEmployeesUseCase.execute({
        companyId: req.user.companyId,
        search,
        branch,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de empleados vacia' : 'Empleados obtenidos correctamente',
        total: result.total,
        data: result.items.map(toEmployeeDTO),
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalRecords: result.total,
          limit: result.limit,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo empleados');
    }
  };

  getOne = async (req, res) => {
    try {
      const employee = await this.getEmployeeByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Empleado encontrado', data: toEmployeeDTO(employee) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo empleado');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const employee = await this.createEmployeeUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Empleado creado exitosamente', newEmployee: toEmployeeDTO(employee) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando empleado');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const employee = await this.updateEmployeeUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Empleado actualizado correctamente', employee: toEmployeeDTO(employee) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando empleado');
    }
  };

  activate = async (req, res) => {
    try {
      const employee = await this.activateEmployeeUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Empleado activado correctamente', employee: toEmployeeDTO(employee) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el empleado');
    }
  };

  deactivate = async (req, res) => {
    try {
      const employee = await this.deactivateEmployeeUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Empleado desactivado correctamente', employee: toEmployeeDTO(employee) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el empleado');
    }
  };
}
