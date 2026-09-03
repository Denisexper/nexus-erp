import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';

import { ExpenseTypeModel } from '../persistence/expenseTypeMongooseModel.js';
import { MongoExpenseTypeRepository } from '../persistence/MongoExpenseTypeRepository.js';
import { ListExpenseTypesUseCase } from '../../application/use-cases/listExpenseTypes.js';
import { GetExpenseTypeByIdUseCase } from '../../application/use-cases/getExpenseTypeById.js';
import { CreateExpenseTypeUseCase } from '../../application/use-cases/createExpenseType.js';
import { UpdateExpenseTypeUseCase } from '../../application/use-cases/updateExpenseType.js';
import { ActivateExpenseTypeUseCase } from '../../application/use-cases/activateExpenseType.js';
import { DeactivateExpenseTypeUseCase } from '../../application/use-cases/deactivateExpenseType.js';
import { ExpenseTypeController } from './expenseType.controller.js';

// --- Composition root ---
const expenseTypeRepository = new MongoExpenseTypeRepository();

const controller = new ExpenseTypeController({
    listExpenseTypes: new ListExpenseTypesUseCase(expenseTypeRepository),
    getExpenseTypeById: new GetExpenseTypeByIdUseCase(expenseTypeRepository),
    createExpenseType: new CreateExpenseTypeUseCase(expenseTypeRepository),
    updateExpenseType: new UpdateExpenseTypeUseCase(expenseTypeRepository),
    activateExpenseType: new ActivateExpenseTypeUseCase(expenseTypeRepository),
    deactivateExpenseType: new DeactivateExpenseTypeUseCase(expenseTypeRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// categories.routes.js.
const requireOwnCompanyExpenseType = async (req, res, next) => {
    try {
        const doc = await ExpenseTypeModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Tipo de gasto no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const expenseTypeAudit = {
    entityModel: ExpenseTypeModel,
    snapshot: { fields: ['company', 'name', 'description', 'isActive'] },
    compareFields: ['name', 'description', 'isActive']
};

// Catálogo de tipos de gasto (Transporte, Flete, Seguro, Aduana, ...) del
// módulo de Compras — ERS v0.8, capítulo 6.8.14. Primer módulo del capítulo:
// prerrequisito de purchase-quotations y purchase-orders, que referencian
// expense_types para sus gastos asociados. Mismo patrón completo
// view/create/update/activate/deactivate que categories/units.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'expense_types.view',
        description: 'Listar tipos de gasto',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'expense_types.view',
        description: 'Obtener un tipo de gasto',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del tipo de gasto',
        handler: createEntityHistoryHandler(ExpenseTypeModel.modelName, 'id'),
        middlewares: [requireOwnCompanyExpenseType]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'expense_types.create',
        description: 'Crear tipo de gasto',
        handler: controller.create,
        middlewares: [logAction({ ...expenseTypeAudit, action: 'create', resource: 'expense_types', responseKey: 'newExpenseType' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'expense_types.update',
        description: 'Actualizar tipo de gasto',
        handler: controller.update,
        middlewares: [logAction({ ...expenseTypeAudit, action: 'update', resource: 'expense_types', responseKey: 'expenseType' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'expense_types.activate',
        description: 'Activar tipo de gasto',
        handler: controller.activate,
        middlewares: [logAction({ ...expenseTypeAudit, action: 'update', resource: 'expense_types', responseKey: 'expenseType' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'expense_types.deactivate',
        description: 'Desactivar tipo de gasto',
        handler: controller.deactivate,
        middlewares: [logAction({ ...expenseTypeAudit, action: 'update', resource: 'expense_types', responseKey: 'expenseType' })]
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

export const expenseTypeRoutes = routes;
export default router;
