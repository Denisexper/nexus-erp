import {
  InvalidCategoryIdError,
  CategoryNotFoundError,
  DuplicateCategoryNameError,
} from '../../domain/errors.js';

const toCategoryDTO = (category) => ({
  _id: category.id,
  id: category.id,
  company: category.company,
  name: category.name,
  description: category.description,
  isActive: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

// `company` no viene del body: siempre se fuerza desde req.user.companyId
// (ver create() más abajo), nunca se confía en lo que mande el cliente.
const FIELDS = ['name', 'description'];

export class CategoryController {
  constructor({ listCategories, getCategoryById, createCategory, updateCategory, activateCategory, deactivateCategory }) {
    this.listCategoriesUseCase = listCategories;
    this.getCategoryByIdUseCase = getCategoryById;
    this.createCategoryUseCase = createCategory;
    this.updateCategoryUseCase = updateCategory;
    this.activateCategoryUseCase = activateCategory;
    this.deactivateCategoryUseCase = deactivateCategory;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidCategoryIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof CategoryNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateCategoryNameError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listCategoriesUseCase.execute({
        search,
        companyId: req.user.companyId,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de categorías vacia' : 'Categorías obtenidas correctamente',
        total: result.total,
        data: result.items.map(toCategoryDTO),
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
      this.#handleError(res, error, 'Error obteniendo categorías');
    }
  };

  getOne = async (req, res) => {
    try {
      const category = await this.getCategoryByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Categoría encontrada', data: toCategoryDTO(category) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo categoría');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, FIELDS);
      const category = await this.createCategoryUseCase.execute({ ...data, company: req.user.companyId });
      res.status(201).json({ msj: 'Categoría creada exitosamente', newCategory: toCategoryDTO(category) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando categoría');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, FIELDS);
      const category = await this.updateCategoryUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Categoría actualizada correctamente', category: toCategoryDTO(category) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando categoría');
    }
  };

  activate = async (req, res) => {
    try {
      const category = await this.activateCategoryUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Categoría activada correctamente', category: toCategoryDTO(category) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la categoría');
    }
  };

  deactivate = async (req, res) => {
    try {
      const category = await this.deactivateCategoryUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Categoría desactivada correctamente', category: toCategoryDTO(category) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la categoría');
    }
  };
}
