import {
  InvalidVehicleIdError,
  VehicleNotFoundError,
  EmployeeNotFoundForVehicleError,
  InactiveEmployeeForVehicleError,
  DuplicateVehiclePlateError,
  InvalidVehicleYearError,
} from '../../domain/errors.js';

const toVehicleDTO = (vehicle) => ({
  _id: vehicle.id,
  id: vehicle.id,
  employee: vehicle.employee,
  plate: vehicle.plate,
  brand: vehicle.brand,
  model: vehicle.model,
  year: vehicle.year,
  isActive: vehicle.isActive,
  createdAt: vehicle.createdAt,
  updatedAt: vehicle.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['employee', 'plate', 'brand', 'model', 'year'];
const UPDATE_FIELDS = ['employee', 'plate', 'brand', 'model', 'year'];

export class VehicleController {
  constructor({ listVehicles, getVehicleById, createVehicle, updateVehicle, activateVehicle, deactivateVehicle }) {
    this.listVehiclesUseCase = listVehicles;
    this.getVehicleByIdUseCase = getVehicleById;
    this.createVehicleUseCase = createVehicle;
    this.updateVehicleUseCase = updateVehicle;
    this.activateVehicleUseCase = activateVehicle;
    this.deactivateVehicleUseCase = deactivateVehicle;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidVehicleIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof VehicleNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof EmployeeNotFoundForVehicleError) return res.status(400).json({ msj: error.message });
    if (error instanceof InactiveEmployeeForVehicleError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateVehiclePlateError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidVehicleYearError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, employee, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listVehiclesUseCase.execute({
        companyId: req.user.companyId,
        search,
        employee,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de vehiculos vacia' : 'Vehículos obtenidos correctamente',
        total: result.total,
        data: result.items.map(toVehicleDTO),
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
      this.#handleError(res, error, 'Error obteniendo vehículos');
    }
  };

  getOne = async (req, res) => {
    try {
      const vehicle = await this.getVehicleByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Vehículo encontrado', data: toVehicleDTO(vehicle) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo vehículo');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const vehicle = await this.createVehicleUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Vehículo creado exitosamente', newVehicle: toVehicleDTO(vehicle) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando vehículo');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const vehicle = await this.updateVehicleUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Vehículo actualizado correctamente', vehicle: toVehicleDTO(vehicle) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando vehículo');
    }
  };

  activate = async (req, res) => {
    try {
      const vehicle = await this.activateVehicleUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Vehículo activado correctamente', vehicle: toVehicleDTO(vehicle) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el vehículo');
    }
  };

  deactivate = async (req, res) => {
    try {
      const vehicle = await this.deactivateVehicleUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Vehículo desactivado correctamente', vehicle: toVehicleDTO(vehicle) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el vehículo');
    }
  };
}
