import {
  InvalidUnitIdError,
  UnitNotFoundError,
  DuplicateUnitNameError,
} from '../../domain/errors.js';

const toUnitDTO = (unit) => ({
  _id: unit.id,
  id: unit.id,
  company: unit.company,
  name: unit.name,
  type: unit.type,
  isActive: unit.isActive,
  createdAt: unit.createdAt,
  updatedAt: unit.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const FIELDS = ['name', 'type'];

export class UnitController {
  constructor({ listUnits, getUnitById, createUnit, updateUnit, activateUnit, deactivateUnit }) {
    this.listUnitsUseCase = listUnits;
    this.getUnitByIdUseCase = getUnitById;
    this.createUnitUseCase = createUnit;
    this.updateUnitUseCase = updateUnit;
    this.activateUnitUseCase = activateUnit;
    this.deactivateUnitUseCase = deactivateUnit;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidUnitIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof UnitNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateUnitNameError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listUnitsUseCase.execute({
        search,
        companyId: req.user.companyId,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de unidades vacia' : 'Unidades obtenidas correctamente',
        total: result.total,
        data: result.items.map(toUnitDTO),
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
      this.#handleError(res, error, 'Error obteniendo unidades');
    }
  };

  getOne = async (req, res) => {
    try {
      const unit = await this.getUnitByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Unidad encontrada', data: toUnitDTO(unit) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo unidad');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, FIELDS);
      const unit = await this.createUnitUseCase.execute({ ...data, company: req.user.companyId });
      res.status(201).json({ msj: 'Unidad creada exitosamente', newUnit: toUnitDTO(unit) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando unidad');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, FIELDS);
      const unit = await this.updateUnitUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Unidad actualizada correctamente', unit: toUnitDTO(unit) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando unidad');
    }
  };

  activate = async (req, res) => {
    try {
      const unit = await this.activateUnitUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Unidad activada correctamente', unit: toUnitDTO(unit) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la unidad');
    }
  };

  deactivate = async (req, res) => {
    try {
      const unit = await this.deactivateUnitUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Unidad desactivada correctamente', unit: toUnitDTO(unit) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la unidad');
    }
  };
}
