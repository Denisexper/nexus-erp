import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoCategoryRepository } from '#modules/categories/infrastructure/persistence/MongoCategoryRepository.js';

import { SubCategoryModel } from '../persistence/subCategoryMongooseModel.js';
import { MongoSubCategoryRepository } from '../persistence/MongoSubCategoryRepository.js';
import { ListSubCategoriesUseCase } from '../../application/use-cases/listSubCategories.js';
import { GetSubCategoryByIdUseCase } from '../../application/use-cases/getSubCategoryById.js';
import { CreateSubCategoryUseCase } from '../../application/use-cases/createSubCategory.js';
import { UpdateSubCategoryUseCase } from '../../application/use-cases/updateSubCategory.js';
import { ActivateSubCategoryUseCase } from '../../application/use-cases/activateSubCategory.js';
import { DeactivateSubCategoryUseCase } from '../../application/use-cases/deactivateSubCategory.js';
import { SubCategoryController } from './subCategory.controller.js';

// --- Composition root ---
const subCategoryRepository = new MongoSubCategoryRepository();
const categoryRepository = new MongoCategoryRepository();

const controller = new SubCategoryController({
    listSubCategories: new ListSubCategoriesUseCase(subCategoryRepository, categoryRepository),
    getSubCategoryById: new GetSubCategoryByIdUseCase(subCategoryRepository, categoryRepository),
    createSubCategory: new CreateSubCategoryUseCase(subCategoryRepository, categoryRepository),
    updateSubCategory: new UpdateSubCategoryUseCase(subCategoryRepository, categoryRepository),
    activateSubCategory: new ActivateSubCategoryUseCase(subCategoryRepository, categoryRepository),
    deactivateSubCategory: new DeactivateSubCategoryUseCase(subCategoryRepository, categoryRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; ownership se
// valida acá recorriendo subCategory -> category -> company (igual que
// warehouses.routes.js con branch -> company).
const requireOwnCompanySubCategory = async (req, res, next) => {
    try {
        const doc = await SubCategoryModel.findById(req.params.id).select('category').populate({ path: 'category', select: 'company' });
        if (!doc || String(doc.category?.company) !== String(req.user.companyId)) {
            return res.status(404).json({ msj: 'Sub-categoría no encontrada' });
        }
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const subCategoryAudit = {
    entityModel: SubCategoryModel,
    snapshot: { fields: ['category', 'name', 'description', 'isActive'], populate: 'category' },
    compareFields: ['name', 'description', 'isActive']
};

// Catálogo de sub-categorías de producto, sin sección propia en el ERS v0.5
// (llega solo hasta el capítulo 6.5). Construido a partir del diagrama de BD
// de Denis. FK obligatoria a `categories`, nombre único por categoría (no
// global), mismo patrón que warehouses/branch. "Consulta por categoría" se
// resuelve con GET /sub-categories?category=<id>.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'sub_categories.view',
        description: 'Listar sub-categorías de producto',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'sub_categories.view',
        description: 'Obtener una sub-categoría de producto',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la sub-categoría',
        handler: createEntityHistoryHandler(SubCategoryModel.modelName, 'id'),
        middlewares: [requireOwnCompanySubCategory]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'sub_categories.create',
        description: 'Crear sub-categoría de producto',
        handler: controller.create,
        middlewares: [logAction({ ...subCategoryAudit, action: 'create', resource: 'sub_categories', responseKey: 'newSubCategory' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'sub_categories.update',
        description: 'Actualizar sub-categoría de producto',
        handler: controller.update,
        middlewares: [logAction({ ...subCategoryAudit, action: 'update', resource: 'sub_categories', responseKey: 'subCategory' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'sub_categories.activate',
        description: 'Activar sub-categoría de producto',
        handler: controller.activate,
        middlewares: [logAction({ ...subCategoryAudit, action: 'update', resource: 'sub_categories', responseKey: 'subCategory' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'sub_categories.deactivate',
        description: 'Desactivar sub-categoría de producto',
        handler: controller.deactivate,
        middlewares: [logAction({ ...subCategoryAudit, action: 'update', resource: 'sub_categories', responseKey: 'subCategory' })]
    }
];

routes.forEach(route => {
    const allMiddlewares = [
        authMiddleware,
        checkPermission(route.permission),
        ...route.middlewares
    ];

    router[route.method.toLowerCase()](
        route.path,
        ...allMiddlewares,
        route.handler
    );
});

export const subCategoryRoutes = routes;
export default router;
