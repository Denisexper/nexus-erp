import {
  InvalidWarehouseIdError,
  WarehouseNotFoundError,
  BranchNotFoundForWarehouseError,
  WarehouseCategoryNotFoundForWarehouseError,
  DuplicateWarehouseNameError,
} from '../../domain/errors.js';

const toWarehouseDTO = (warehouse) => ({
  _id: warehouse.id,
  id: warehouse.id,
  branch: warehouse.branch,
  warehouseCategory: warehouse.warehouseCategory,
  name: warehouse.name,
  description: warehouse.description,
  isActive: warehouse.isActive,
  createdAt: warehouse.createdAt,
  updatedAt: warehouse.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['branch', 'warehouseCategory', 'name', 'description'];
// `branch` no es editable después de creado el almacén (igual que `company` en branches).
const UPDATE_FIELDS = ['warehouseCategory', 'name', 'description'];

export class WarehouseController {
  constructor({ listWarehouses, getWarehouseById, createWarehouse, updateWarehouse, activateWarehouse, deactivateWarehouse }) {
    this.listWarehousesUseCase = listWarehouses;
    this.getWarehouseByIdUseCase = getWarehouseById;
    this.createWarehouseUseCase = createWarehouse;
    this.updateWarehouseUseCase = updateWarehouse;
    this.activateWarehouseUseCase = activateWarehouse;
    this.deactivateWarehouseUseCase = deactivateWarehouse;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidWarehouseIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof WarehouseNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof BranchNotFoundForWarehouseError) return res.status(400).json({ msj: error.message });
    if (error instanceof WarehouseCategoryNotFoundForWarehouseError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateWarehouseNameError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, branch, warehouseCategory, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listWarehousesUseCase.execute({
        companyId: req.user.companyId,
        search,
        branch,
        warehouseCategory,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de almacenes vacia' : 'Almacenes obtenidos correctamente',
        total: result.total,
        data: result.items.map(toWarehouseDTO),
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
      this.#handleError(res, error, 'Error obteniendo almacenes');
    }
  };

  getOne = async (req, res) => {
    try {
      const warehouse = await this.getWarehouseByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Almacén encontrado', data: toWarehouseDTO(warehouse) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo almacén');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const warehouse = await this.createWarehouseUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Almacén creado exitosamente', newWarehouse: toWarehouseDTO(warehouse) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando almacén');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const warehouse = await this.updateWarehouseUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Almacén actualizado correctamente', warehouse: toWarehouseDTO(warehouse) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando almacén');
    }
  };

  activate = async (req, res) => {
    try {
      const warehouse = await this.activateWarehouseUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Almacén activado correctamente', warehouse: toWarehouseDTO(warehouse) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el almacén');
    }
  };

  deactivate = async (req, res) => {
    try {
      const warehouse = await this.deactivateWarehouseUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Almacén desactivado correctamente', warehouse: toWarehouseDTO(warehouse) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el almacén');
    }
  };
}
