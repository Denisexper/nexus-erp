import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { resolveEmployeeIdsForCompany } from '#shared/lib/tenantScope.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';
import { MongoEmployeeRepository } from '#modules/employees/infrastructure/persistence/MongoEmployeeRepository.js';

import { VehicleModel } from '../persistence/vehicleMongooseModel.js';
import { MongoVehicleRepository } from '../persistence/MongoVehicleRepository.js';
import { ListVehiclesUseCase } from '../../application/use-cases/listVehicles.js';
import { GetVehicleByIdUseCase } from '../../application/use-cases/getVehicleById.js';
import { CreateVehicleUseCase } from '../../application/use-cases/createVehicle.js';
import { UpdateVehicleUseCase } from '../../application/use-cases/updateVehicle.js';
import { ActivateVehicleUseCase } from '../../application/use-cases/activateVehicle.js';
import { DeactivateVehicleUseCase } from '../../application/use-cases/deactivateVehicle.js';
import { VehicleController } from './vehicle.controller.js';

// --- Composition root ---
const vehicleRepository = new MongoVehicleRepository();
const employeeRepository = new MongoEmployeeRepository();
const branchRepository = new MongoBranchRepository();

const controller = new VehicleController({
    listVehicles: new ListVehiclesUseCase(vehicleRepository, employeeRepository, branchRepository),
    getVehicleById: new GetVehicleByIdUseCase(vehicleRepository, employeeRepository, branchRepository),
    createVehicle: new CreateVehicleUseCase(vehicleRepository, employeeRepository, branchRepository),
    updateVehicle: new UpdateVehicleUseCase(vehicleRepository, employeeRepository, branchRepository),
    activateVehicle: new ActivateVehicleUseCase(vehicleRepository, employeeRepository, branchRepository),
    deactivateVehicle: new DeactivateVehicleUseCase(vehicleRepository, employeeRepository, branchRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; la ownership
// check pasa por la cadena vehicle -> employee -> branch -> company.
const requireOwnCompanyVehicle = async (req, res, next) => {
    try {
        const employeeIds = await resolveEmployeeIdsForCompany(req.user.companyId, branchRepository, employeeRepository);
        const doc = await VehicleModel.findOne({ _id: req.params.id, employee: { $in: employeeIds } }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Vehículo no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const vehicleAudit = {
    entityModel: VehicleModel,
    snapshot: { fields: ['employee', 'plate', 'brand', 'model', 'year', 'isActive'] },
    compareFields: ['employee', 'plate', 'brand', 'model', 'year', 'isActive']
};

// Fase 1 del plan de Flota (ERS v1.1, sección 4.6 — Encargado de Logística
// "administra vehículos"). Mismo criterio que branches/warehouses/employees:
// view/create/update/activate/deactivate, sin delete físico.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'vehicles.view',
        description: 'Listar vehículos',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'vehicles.view',
        description: 'Obtener un vehículo',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del vehículo',
        handler: createEntityHistoryHandler(VehicleModel.modelName, 'id'),
        middlewares: [requireOwnCompanyVehicle]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'vehicles.create',
        description: 'Crear nuevo vehículo',
        handler: controller.create,
        middlewares: [logAction({ ...vehicleAudit, action: 'create', resource: 'vehicles', responseKey: 'newVehicle' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'vehicles.update',
        description: 'Actualizar vehículo',
        handler: controller.update,
        middlewares: [logAction({ ...vehicleAudit, action: 'update', resource: 'vehicles', responseKey: 'vehicle' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'vehicles.activate',
        description: 'Activar vehículo',
        handler: controller.activate,
        middlewares: [logAction({ ...vehicleAudit, action: 'update', resource: 'vehicles', responseKey: 'vehicle' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'vehicles.deactivate',
        description: 'Desactivar vehículo',
        handler: controller.deactivate,
        middlewares: [logAction({ ...vehicleAudit, action: 'update', resource: 'vehicles', responseKey: 'vehicle' })]
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

export const vehicleRoutes = routes;
export default router;
