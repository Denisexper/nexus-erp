import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';

import { UnitModel } from '../persistence/unitMongooseModel.js';
import { MongoUnitRepository } from '../persistence/MongoUnitRepository.js';
import { ListUnitsUseCase } from '../../application/use-cases/listUnits.js';
import { GetUnitByIdUseCase } from '../../application/use-cases/getUnitById.js';
import { CreateUnitUseCase } from '../../application/use-cases/createUnit.js';
import { UpdateUnitUseCase } from '../../application/use-cases/updateUnit.js';
import { ActivateUnitUseCase } from '../../application/use-cases/activateUnit.js';
import { DeactivateUnitUseCase } from '../../application/use-cases/deactivateUnit.js';
import { UnitController } from './unit.controller.js';

// --- Composition root ---
const unitRepository = new MongoUnitRepository();

const controller = new UnitController({
    listUnits: new ListUnitsUseCase(unitRepository),
    getUnitById: new GetUnitByIdUseCase(unitRepository),
    createUnit: new CreateUnitUseCase(unitRepository),
    updateUnit: new UpdateUnitUseCase(unitRepository),
    activateUnit: new ActivateUnitUseCase(unitRepository),
    deactivateUnit: new DeactivateUnitUseCase(unitRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; ownership se
// valida acá, igual que en branches.routes.js / categories.routes.js.
const requireOwnCompanyUnit = async (req, res, next) => {
    try {
        const doc = await UnitModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Unidad no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const unitAudit = {
    entityModel: UnitModel,
    snapshot: { fields: ['company', 'name', 'type', 'isActive'] },
    compareFields: ['name', 'type', 'isActive']
};

// Catálogo de unidades de medida de producto, sin sección propia en el ERS
// v0.5 (llega solo hasta el capítulo 6.5). Construido a partir del diagrama
// de BD de Denis. Mismo patrón completo view/create/update/activate/deactivate
// que countries/categories.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'units.view',
        description: 'Listar unidades de medida',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'units.view',
        description: 'Obtener una unidad de medida',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la unidad',
        handler: createEntityHistoryHandler(UnitModel.modelName, 'id'),
        middlewares: [requireOwnCompanyUnit]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'units.create',
        description: 'Crear unidad de medida',
        handler: controller.create,
        middlewares: [logAction({ ...unitAudit, action: 'create', resource: 'units', responseKey: 'newUnit' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'units.update',
        description: 'Actualizar unidad de medida',
        handler: controller.update,
        middlewares: [logAction({ ...unitAudit, action: 'update', resource: 'units', responseKey: 'unit' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'units.activate',
        description: 'Activar unidad de medida',
        handler: controller.activate,
        middlewares: [logAction({ ...unitAudit, action: 'update', resource: 'units', responseKey: 'unit' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'units.deactivate',
        description: 'Desactivar unidad de medida',
        handler: controller.deactivate,
        middlewares: [logAction({ ...unitAudit, action: 'update', resource: 'units', responseKey: 'unit' })]
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

export const unitRoutes = routes;
export default router;
