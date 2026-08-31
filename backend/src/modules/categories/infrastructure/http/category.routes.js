import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';

import { CategoryModel } from '../persistence/categoryMongooseModel.js';
import { MongoCategoryRepository } from '../persistence/MongoCategoryRepository.js';
import { ListCategoriesUseCase } from '../../application/use-cases/listCategories.js';
import { GetCategoryByIdUseCase } from '../../application/use-cases/getCategoryById.js';
import { CreateCategoryUseCase } from '../../application/use-cases/createCategory.js';
import { UpdateCategoryUseCase } from '../../application/use-cases/updateCategory.js';
import { ActivateCategoryUseCase } from '../../application/use-cases/activateCategory.js';
import { DeactivateCategoryUseCase } from '../../application/use-cases/deactivateCategory.js';
import { CategoryController } from './category.controller.js';

// --- Composition root ---
const categoryRepository = new MongoCategoryRepository();

const controller = new CategoryController({
    listCategories: new ListCategoriesUseCase(categoryRepository),
    getCategoryById: new GetCategoryByIdUseCase(categoryRepository),
    createCategory: new CreateCategoryUseCase(categoryRepository),
    updateCategory: new UpdateCategoryUseCase(categoryRepository),
    activateCategory: new ActivateCategoryUseCase(categoryRepository),
    deactivateCategory: new DeactivateCategoryUseCase(categoryRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// branches.routes.js.
const requireOwnCompanyCategory = async (req, res, next) => {
    try {
        const doc = await CategoryModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Categoría no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const categoryAudit = {
    entityModel: CategoryModel,
    snapshot: { fields: ['company', 'name', 'description', 'isActive'] },
    compareFields: ['name', 'description', 'isActive']
};

// Catálogo de categorías de producto, sin sección propia en el ERS v0.5
// (llega solo hasta el capítulo 6.5). Construido a partir del diagrama de
// BD de Denis. Mismo patrón completo view/create/update/activate/deactivate
// que companies/branches/warehouses.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'categories.view',
        description: 'Listar categorías de producto',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'categories.view',
        description: 'Obtener una categoría de producto',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la categoría',
        handler: createEntityHistoryHandler(CategoryModel.modelName, 'id'),
        middlewares: [requireOwnCompanyCategory]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'categories.create',
        description: 'Crear categoría de producto',
        handler: controller.create,
        middlewares: [logAction({ ...categoryAudit, action: 'create', resource: 'categories', responseKey: 'newCategory' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'categories.update',
        description: 'Actualizar categoría de producto',
        handler: controller.update,
        middlewares: [logAction({ ...categoryAudit, action: 'update', resource: 'categories', responseKey: 'category' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'categories.activate',
        description: 'Activar categoría de producto',
        handler: controller.activate,
        middlewares: [logAction({ ...categoryAudit, action: 'update', resource: 'categories', responseKey: 'category' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'categories.deactivate',
        description: 'Desactivar categoría de producto',
        handler: controller.deactivate,
        middlewares: [logAction({ ...categoryAudit, action: 'update', resource: 'categories', responseKey: 'category' })]
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

export const categoryRoutes = routes;
export default router;
