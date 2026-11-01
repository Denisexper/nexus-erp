import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { MongoInventoryRepository } from '#modules/inventory/infrastructure/persistence/MongoInventoryRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoLocationRepository } from '#modules/locations/infrastructure/persistence/MongoLocationRepository.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';

import { InventoryTransferModel } from '../persistence/inventoryTransferMongooseModel.js';
import { MongoInventoryTransferRepository } from '../persistence/MongoInventoryTransferRepository.js';
import { CreateTransferUseCase } from '../../application/use-cases/createTransfer.js';
import { DispatchTransferUseCase } from '../../application/use-cases/dispatchTransfer.js';
import { ReceiveTransferUseCase } from '../../application/use-cases/receiveTransfer.js';
import { ReportTransferIncidentUseCase } from '../../application/use-cases/reportIncident.js';
import { ListTransfersUseCase } from '../../application/use-cases/listTransfers.js';
import { GetTransferByIdUseCase } from '../../application/use-cases/getTransferById.js';
import { InventoryTransferController } from './inventoryTransfer.controller.js';

// --- Composition root ---
const inventoryTransferRepository = new MongoInventoryTransferRepository();
const inventoryRepository = new MongoInventoryRepository();
const warehouseRepository = new MongoWarehouseRepository();
const locationRepository = new MongoLocationRepository();
const branchRepository = new MongoBranchRepository();

const controller = new InventoryTransferController({
    createTransfer: new CreateTransferUseCase(inventoryTransferRepository, inventoryRepository, warehouseRepository, locationRepository, branchRepository),
    dispatchTransfer: new DispatchTransferUseCase(inventoryTransferRepository, inventoryRepository),
    receiveTransfer: new ReceiveTransferUseCase(inventoryTransferRepository, inventoryRepository),
    reportIncident: new ReportTransferIncidentUseCase(inventoryTransferRepository),
    listTransfers: new ListTransfersUseCase(inventoryTransferRepository),
    getTransferById: new GetTransferByIdUseCase(inventoryTransferRepository),
});

const router = Router();

const transferAudit = {
    entityModel: InventoryTransferModel,
    snapshot: { fields: ['company', 'transferCode', 'sourceWarehouse', 'destinationWarehouse', 'vehicleLocation', 'status', 'notes'] },
    // InventoryTransfer no tiene campo `name`: usamos el código visible (TRF-00001).
    resolveEntityName: (entity) => entity.transferCode,
};

// Módulo de Traslados de Inventario (ERS v1.0, cap. 6.9), Fase 3. Un solo
// permiso cubre todo el ciclo (RN-INV-008/009/019, 6.9.13/6.9.19):
// EN_PREPARACION -> EN_TRANSITO -> RECIBIDO (o -> INCIDENCIA). La resolución
// manual de una incidencia queda fuera de alcance de esta entrega.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'inventory.transfer',
        description: 'Listar traslados de inventario',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'inventory.transfer',
        description: 'Obtener un traslado de inventario',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/',
        permission: 'inventory.transfer',
        description: 'Crear traslado de inventario (planificación, no mueve stock todavía)',
        handler: controller.create,
        middlewares: [logAction({ ...transferAudit, action: 'create', resource: 'inventory_transfers', responseKey: 'newInventoryTransfer' })]
    },
    {
        method: 'PATCH',
        path: '/:id/dispatch',
        permission: 'inventory.transfer',
        description: 'Despachar traslado (origen -> vehículo)',
        handler: controller.dispatch,
        middlewares: [logAction({ ...transferAudit, action: 'update', resource: 'inventory_transfers', responseKey: 'inventoryTransfer' })]
    },
    {
        method: 'PATCH',
        path: '/:id/receive',
        permission: 'inventory.transfer',
        description: 'Recibir traslado (vehículo -> destino)',
        handler: controller.receive,
        middlewares: [logAction({ ...transferAudit, action: 'update', resource: 'inventory_transfers', responseKey: 'inventoryTransfer' })]
    },
    {
        method: 'PATCH',
        path: '/:id/incident',
        permission: 'inventory.transfer',
        description: 'Reportar incidencia en un traslado en tránsito',
        handler: controller.reportIncident,
        middlewares: [logAction({ ...transferAudit, action: 'update', resource: 'inventory_transfers', responseKey: 'inventoryTransfer' })]
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

export const inventoryTransferRoutes = routes;
export default router;
