import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';
import { MongoWarehouseCategoryRepository } from '#modules/warehouse-categories/infrastructure/persistence/MongoWarehouseCategoryRepository.js';

import { WarehouseModel } from '../persistence/warehouseMongooseModel.js';
import { MongoWarehouseRepository } from '../persistence/MongoWarehouseRepository.js';
import { ListWarehousesUseCase } from '../../application/use-cases/listWarehouses.js';
import { GetWarehouseByIdUseCase } from '../../application/use-cases/getWarehouseById.js';
import { CreateWarehouseUseCase } from '../../application/use-cases/createWarehouse.js';
import { UpdateWarehouseUseCase } from '../../application/use-cases/updateWarehouse.js';
import { ActivateWarehouseUseCase } from '../../application/use-cases/activateWarehouse.js';
import { DeactivateWarehouseUseCase } from '../../application/use-cases/deactivateWarehouse.js';
import { WarehouseController } from './warehouse.controller.js';

// --- Composition root ---
const warehouseRepository = new MongoWarehouseRepository();
const branchRepository = new MongoBranchRepository();
const warehouseCategoryRepository = new MongoWarehouseCategoryRepository();

const controller = new WarehouseController({
    listWarehouses: new ListWarehousesUseCase(warehouseRepository, branchRepository),
    getWarehouseById: new GetWarehouseByIdUseCase(warehouseRepository, branchRepository),
    createWarehouse: new CreateWarehouseUseCase(warehouseRepository, branchRepository, warehouseCategoryRepository),
    updateWarehouse: new UpdateWarehouseUseCase(warehouseRepository, warehouseCategoryRepository, branchRepository),
    activateWarehouse: new ActivateWarehouseUseCase(warehouseRepository, branchRepository),
    deactivateWarehouse: new DeactivateWarehouseUseCase(warehouseRepository, branchRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; la ownership
// check pasa por la misma cadena warehouse -> branch -> company.
const requireOwnCompanyWarehouse = async (req, res, next) => {
    try {
        const branchIds = await branchRepository.findIdsByCompany(req.user.companyId);
        const doc = await WarehouseModel.findOne({ _id: req.params.id, branch: { $in: branchIds } }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Almacén no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const warehouseAudit = {
    entityModel: WarehouseModel,
    snapshot: { fields: ['branch', 'warehouseCategory', 'name', 'description', 'isActive'], populate: 'warehouseCategory' },
    compareFields: ['name', 'description', 'warehouseCategory', 'isActive']
};

// rutas con metadata. ERS 6.5.7: warehouses.view/create/update/activate/
// deactivate (a diferencia de warehouse_categories, aquí SÍ hay activate).
// Sin delete físico. "Consulta por sucursal" (6.5.6) se resuelve con
// GET /warehouses?branch=<id>.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'warehouses.view',
        description: 'Listar almacenes',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'warehouses.view',
        description: 'Obtener un almacén',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del almacén',
        handler: createEntityHistoryHandler(WarehouseModel.modelName, 'id'),
        middlewares: [requireOwnCompanyWarehouse]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'warehouses.create',
        description: 'Crear nuevo almacén',
        handler: controller.create,
        middlewares: [logAction({ ...warehouseAudit, action: 'create', resource: 'warehouses', responseKey: 'newWarehouse' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'warehouses.update',
        description: 'Actualizar almacén',
        handler: controller.update,
        middlewares: [logAction({ ...warehouseAudit, action: 'update', resource: 'warehouses', responseKey: 'warehouse' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'warehouses.activate',
        description: 'Activar almacén',
        handler: controller.activate,
        middlewares: [logAction({ ...warehouseAudit, action: 'update', resource: 'warehouses', responseKey: 'warehouse' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'warehouses.deactivate',
        description: 'Desactivar almacén',
        handler: controller.deactivate,
        middlewares: [logAction({ ...warehouseAudit, action: 'update', resource: 'warehouses', responseKey: 'warehouse' })]
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

export const warehouseRoutes = routes;
export default router;
