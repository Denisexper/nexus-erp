import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { MongoProductRepository } from '#modules/products/infrastructure/persistence/MongoProductRepository.js';
import { MongoLocationRepository } from '#modules/locations/infrastructure/persistence/MongoLocationRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';

import { KardexMovementModel } from '../persistence/kardexMongooseModel.js';
import { MongoKardexRepository } from '../persistence/MongoKardexRepository.js';
import { ListMovementsUseCase } from '../../application/use-cases/listMovements.js';
import { GetMovementByIdUseCase } from '../../application/use-cases/getMovementById.js';
import { RegisterMovementUseCase } from '../../application/use-cases/registerMovement.js';
import { RegisterTransferUseCase } from '../../application/use-cases/registerTransfer.js';
import { GetStockByLocationUseCase } from '../../application/use-cases/getStockByLocation.js';
import { GetStockByProductUseCase } from '../../application/use-cases/getStockByProduct.js';
import { KardexController } from './kardex.controller.js';

// --- Composition root ---
const kardexRepository = new MongoKardexRepository();
const productRepository = new MongoProductRepository();
const locationRepository = new MongoLocationRepository();
const warehouseRepository = new MongoWarehouseRepository();
const branchRepository = new MongoBranchRepository();

const controller = new KardexController({
    listMovements: new ListMovementsUseCase(kardexRepository, branchRepository, warehouseRepository, locationRepository),
    getMovementById: new GetMovementByIdUseCase(kardexRepository, branchRepository, warehouseRepository, locationRepository),
    registerMovement: new RegisterMovementUseCase(kardexRepository, productRepository, locationRepository, branchRepository, warehouseRepository),
    registerTransfer: new RegisterTransferUseCase(kardexRepository, productRepository, locationRepository, branchRepository, warehouseRepository),
    getStockByLocation: new GetStockByLocationUseCase(kardexRepository, locationRepository, branchRepository, warehouseRepository),
    getStockByProduct: new GetStockByProductUseCase(kardexRepository, productRepository, branchRepository, warehouseRepository, locationRepository),
});

const router = Router();

const kardexAudit = {
    entityModel: KardexMovementModel,
    snapshot: { fields: ['product', 'location', 'type', 'reason', 'quantity', 'notes', 'transferRef'] },
    // KardexMovement no tiene campo `name`: es un asiento contable, no una
    // entidad con nombre propio (mismo caso que locations/product-images).
    resolveEntityName: (entity) => `${entity.type === 'in' ? 'Entrada' : 'Salida'} · ${entity.quantity} u.`,
};

// rutas con metadata (auto-discovery de permisos). El kardex es append-only:
// no hay update ni delete, solo se agregan movimientos nuevos.
const routes = [
    {
        method: 'GET',
        path: '/movements',
        permission: 'kardex.view',
        description: 'Listar movimientos del kardex',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/movements/:id',
        permission: 'kardex.view',
        description: 'Obtener un movimiento del kardex',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/movements',
        permission: 'kardex.create',
        description: 'Registrar entrada, salida o ajuste de stock',
        handler: controller.createMovement,
        middlewares: [logAction({ ...kardexAudit, action: 'create', resource: 'kardex', responseKey: 'newMovement' })]
    },
    {
        // La bitácora se escribe dentro del propio controller (ver createTransfer),
        // no acá, porque logAction espera una única entidad en la respuesta y
        // este endpoint devuelve un par de movimientos (out + in).
        method: 'POST',
        path: '/transfers',
        permission: 'kardex.create',
        description: 'Transferir stock de un producto entre ubicaciones',
        handler: controller.createTransfer,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/stock/by-location/:locationId',
        permission: 'kardex.view',
        description: 'Consultar existencias de todos los productos en una ubicación',
        handler: controller.getStockByLocation,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/stock/by-product/:productId',
        permission: 'kardex.view',
        description: 'Consultar existencias de un producto en todas las ubicaciones',
        handler: controller.getStockByProduct,
        middlewares: []
    },
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

export const kardexRoutes = routes;
export default router;
