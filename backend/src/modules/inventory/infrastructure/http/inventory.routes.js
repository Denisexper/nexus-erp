import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { MongoLocationRepository } from '#modules/locations/infrastructure/persistence/MongoLocationRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';

import { InventoryLotModel } from '../persistence/inventoryLotMongooseModel.js';
import { MongoInventoryRepository } from '../persistence/MongoInventoryRepository.js';
import { ListInventoryLotsUseCase } from '../../application/use-cases/listInventoryLots.js';
import { GetInventoryLotByIdUseCase } from '../../application/use-cases/getInventoryLotById.js';
import { AssignLotToLocationUseCase } from '../../application/use-cases/assignLotToLocation.js';
import { InventoryController } from './inventory.controller.js';

// --- Composition root ---
const inventoryRepository = new MongoInventoryRepository();
const locationRepository = new MongoLocationRepository();
const warehouseRepository = new MongoWarehouseRepository();
const branchRepository = new MongoBranchRepository();

const controller = new InventoryController({
    listInventoryLots: new ListInventoryLotsUseCase(inventoryRepository),
    getInventoryLotById: new GetInventoryLotByIdUseCase(inventoryRepository),
    assignLotToLocation: new AssignLotToLocationUseCase(inventoryRepository, locationRepository, branchRepository, warehouseRepository),
});

const router = Router();

const inventoryLotAudit = {
    entityModel: InventoryLotModel,
    snapshot: { fields: ['company', 'lotCode', 'product', 'purchaseDetail', 'quantityReceived', 'quantityAssigned', 'unitCost', 'totalCost', 'status'] },
    // InventoryLot no tiene campo `name`: usamos el código visible (LOT-00001).
    resolveEntityName: (entity) => entity.lotCode,
};

// Módulo de Inventario (ERS v1.0, cap. 6.9), Fase 1: lotes + asignación a
// ubicación. El lote se crea automático al confirmar una compra
// (createPurchase.js), no hay endpoint para crearlo a mano — por eso no
// existe un POST /lots acá. `inventory.lots.view`/`inventory.location.assign`
// son los nombres de permiso que el propio ERS 6.9.17 sugiere.
const routes = [
    {
        method: 'GET',
        path: '/lots',
        permission: 'inventory.lots.view',
        description: 'Listar lotes de inventario',
        handler: controller.getAllLots,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/lots/:id',
        permission: 'inventory.lots.view',
        description: 'Obtener un lote de inventario',
        handler: controller.getOneLot,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/lots/:id/assign',
        permission: 'inventory.location.assign',
        description: 'Asignar mercancía de un lote a una ubicación física',
        handler: controller.assignLot,
        middlewares: [logAction({ ...inventoryLotAudit, action: 'update', resource: 'inventory_lots', responseKey: 'data' })]
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

export const inventoryRoutes = routes;
export default router;
