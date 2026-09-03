import {
  InvalidExpenseTypeIdError,
  ExpenseTypeNotFoundError,
  DuplicateExpenseTypeNameError,
} from '../../domain/errors.js';

const toExpenseTypeDTO = (expenseType) => ({
  _id: expenseType.id,
  id: expenseType.id,
  company: expenseType.company,
  name: expenseType.name,
  description: expenseType.description,
  isActive: expenseType.isActive,
  createdAt: expenseType.createdAt,
  updatedAt: expenseType.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

// `company` no viene del body: siempre se fuerza desde req.user.companyId
// (ver create() más abajo), nunca se confía en lo que mande el cliente.
const FIELDS = ['name', 'description'];

export class ExpenseTypeController {
  constructor({ listExpenseTypes, getExpenseTypeById, createExpenseType, updateExpenseType, activateExpenseType, deactivateExpenseType }) {
    this.listExpenseTypesUseCase = listExpenseTypes;
    this.getExpenseTypeByIdUseCase = getExpenseTypeById;
    this.createExpenseTypeUseCase = createExpenseType;
    this.updateExpenseTypeUseCase = updateExpenseType;
    this.activateExpenseTypeUseCase = activateExpenseType;
    this.deactivateExpenseTypeUseCase = deactivateExpenseType;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidExpenseTypeIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof ExpenseTypeNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateExpenseTypeNameError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listExpenseTypesUseCase.execute({
        search,
        companyId: req.user.companyId,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de tipos de gasto vacia' : 'Tipos de gasto obtenidos correctamente',
        total: result.total,
        data: result.items.map(toExpenseTypeDTO),
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
      this.#handleError(res, error, 'Error obteniendo tipos de gasto');
    }
  };

  getOne = async (req, res) => {
    try {
      const expenseType = await this.getExpenseTypeByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Tipo de gasto encontrado', data: toExpenseTypeDTO(expenseType) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo tipo de gasto');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, FIELDS);
      const expenseType = await this.createExpenseTypeUseCase.execute({ ...data, company: req.user.companyId });
      res.status(201).json({ msj: 'Tipo de gasto creado exitosamente', newExpenseType: toExpenseTypeDTO(expenseType) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando tipo de gasto');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, FIELDS);
      const expenseType = await this.updateExpenseTypeUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Tipo de gasto actualizado correctamente', expenseType: toExpenseTypeDTO(expenseType) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando tipo de gasto');
    }
  };

  activate = async (req, res) => {
    try {
      const expenseType = await this.activateExpenseTypeUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Tipo de gasto activado correctamente', expenseType: toExpenseTypeDTO(expenseType) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el tipo de gasto');
    }
  };

  deactivate = async (req, res) => {
    try {
      const expenseType = await this.deactivateExpenseTypeUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Tipo de gasto desactivado correctamente', expenseType: toExpenseTypeDTO(expenseType) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el tipo de gasto');
    }
  };
}
