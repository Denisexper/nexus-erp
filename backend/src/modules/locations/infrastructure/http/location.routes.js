import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoKardexRepository } from '#modules/kardex/infrastructure/persistence/MongoKardexRepository.js';

import { LocationModel } from '../persistence/locationMongooseModel.js';
import { MongoLocationRepository } from '../persistence/MongoLocationRepository.js';
import { ListLocationsUseCase } from '../../application/use-cases/listLocations.js';
import { GetLocationByIdUseCase } from '../../application/use-cases/getLocationById.js';
import { CreateLocationUseCase } from '../../application/use-cases/createLocation.js';
import { CreateLocationsBatchUseCase } from '../../application/use-cases/createLocationsBatch.js';
import { UpdateLocationUseCase } from '../../application/use-cases/updateLocation.js';
import { ActivateLocationUseCase } from '../../application/use-cases/activateLocation.js';
import { DeactivateLocationUseCase } from '../../application/use-cases/deactivateLocation.js';
import { LocationController } from './location.controller.js';

// --- Composition root ---
const locationRepository = new MongoLocationRepository();
const warehouseRepository = new MongoWarehouseRepository();
const kardexRepository = new MongoKardexRepository();

const controller = new LocationController({
    listLocations: new ListLocationsUseCase(locationRepository),
    getLocationById: new GetLocationByIdUseCase(locationRepository),
    createLocation: new CreateLocationUseCase(locationRepository, warehouseRepository),
    createLocationsBatch: new CreateLocationsBatchUseCase(locationRepository, warehouseRepository),
    updateLocation: new UpdateLocationUseCase(locationRepository),
    activateLocation: new ActivateLocationUseCase(locationRepository),
    deactivateLocation: new DeactivateLocationUseCase(locationRepository, kardexRepository),
});

const router = Router();

const locationAudit = {
    entityModel: LocationModel,
    snapshot: { fields: ['warehouse', 'code', 'aisle', 'rack', 'level', 'position', 'capacity', 'isActive'] },
    compareFields: ['code', 'aisle', 'rack', 'level', 'position', 'capacity', 'isActive'],
    // Location no tiene campo `name`: su identidad human-readable es el código.
    resolveEntityName: (entity) => entity.code
};

// rutas con metadata. ERS 6.5.7: locations.view/create/update/activate/
// deactivate. Sin delete físico. "Consultar estructura física de un
// almacén" (CU-039) se resuelve con GET /locations?warehouse=<id>.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'locations.view',
        description: 'Listar ubicaciones',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'locations.view',
        description: 'Obtener una ubicación',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la ubicación',
        handler: createEntityHistoryHandler(LocationModel.modelName, 'id'),
        middlewares: []
    },
    {
        method: 'POST',
        path: '/',
        permission: 'locations.create',
        description: 'Crear nueva ubicación',
        handler: controller.create,
        middlewares: [logAction({ ...locationAudit, action: 'create', resource: 'locations', responseKey: 'newLocation' })]
    },
    {
        // Reutiliza el permiso locations.create: sigue siendo "crear ubicaciones",
        // solo que varias a la vez a partir de rangos de coordenadas. La bitácora
        // se escribe dentro del propio controller (ver createBatch), no acá,
        // porque logAction espera una única entidad en la respuesta y este
        // endpoint devuelve un resumen de lote.
        method: 'POST',
        path: '/batch',
        permission: 'locations.create',
        description: 'Generar ubicaciones por lote a partir de rangos de coordenadas',
        handler: controller.createBatch,
        middlewares: []
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'locations.update',
        description: 'Actualizar ubicación',
        handler: controller.update,
        middlewares: [logAction({ ...locationAudit, action: 'update', resource: 'locations', responseKey: 'location' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'locations.activate',
        description: 'Activar ubicación',
        handler: controller.activate,
        middlewares: [logAction({ ...locationAudit, action: 'update', resource: 'locations', responseKey: 'location' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'locations.deactivate',
        description: 'Desactivar ubicación',
        handler: controller.deactivate,
        middlewares: [logAction({ ...locationAudit, action: 'update', resource: 'locations', responseKey: 'location' })]
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

export const locationRoutes = routes;
export default router;
