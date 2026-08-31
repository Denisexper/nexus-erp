import {
  InvalidSubCategoryIdError,
  SubCategoryNotFoundError,
  CategoryNotFoundForSubCategoryError,
  DuplicateSubCategoryNameError,
} from '../../domain/errors.js';

const toSubCategoryDTO = (subCategory) => ({
  _id: subCategory.id,
  id: subCategory.id,
  category: subCategory.category,
  name: subCategory.name,
  description: subCategory.description,
  isActive: subCategory.isActive,
  createdAt: subCategory.createdAt,
  updatedAt: subCategory.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['category', 'name', 'description'];
// `category` no es editable después de creada la sub-categoría (igual que `branch` en warehouses).
const UPDATE_FIELDS = ['name', 'description'];

export class SubCategoryController {
  constructor({ listSubCategories, getSubCategoryById, createSubCategory, updateSubCategory, activateSubCategory, deactivateSubCategory }) {
    this.listSubCategoriesUseCase = listSubCategories;
    this.getSubCategoryByIdUseCase = getSubCategoryById;
    this.createSubCategoryUseCase = createSubCategory;
    this.updateSubCategoryUseCase = updateSubCategory;
    this.activateSubCategoryUseCase = activateSubCategory;
    this.deactivateSubCategoryUseCase = deactivateSubCategory;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidSubCategoryIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof SubCategoryNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof CategoryNotFoundForSubCategoryError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateSubCategoryNameError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, category, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listSubCategoriesUseCase.execute({
        search,
        companyId: req.user.companyId,
        category,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de sub-categorías vacia' : 'Sub-categorías obtenidas correctamente',
        total: result.total,
        data: result.items.map(toSubCategoryDTO),
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
      this.#handleError(res, error, 'Error obteniendo sub-categorías');
    }
  };

  getOne = async (req, res) => {
    try {
      const subCategory = await this.getSubCategoryByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sub-categoría encontrada', data: toSubCategoryDTO(subCategory) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo sub-categoría');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const subCategory = await this.createSubCategoryUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Sub-categoría creada exitosamente', newSubCategory: toSubCategoryDTO(subCategory) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando sub-categoría');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const subCategory = await this.updateSubCategoryUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Sub-categoría actualizada correctamente', subCategory: toSubCategoryDTO(subCategory) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando sub-categoría');
    }
  };

  activate = async (req, res) => {
    try {
      const subCategory = await this.activateSubCategoryUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sub-categoría activada correctamente', subCategory: toSubCategoryDTO(subCategory) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la sub-categoría');
    }
  };

  deactivate = async (req, res) => {
    try {
      const subCategory = await this.deactivateSubCategoryUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sub-categoría desactivada correctamente', subCategory: toSubCategoryDTO(subCategory) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la sub-categoría');
    }
  };
}
