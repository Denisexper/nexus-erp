import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';

import { EmployeeModel } from '../persistence/employeeMongooseModel.js';
import { MongoEmployeeRepository } from '../persistence/MongoEmployeeRepository.js';
import { ListEmployeesUseCase } from '../../application/use-cases/listEmployees.js';
import { GetEmployeeByIdUseCase } from '../../application/use-cases/getEmployeeById.js';
import { CreateEmployeeUseCase } from '../../application/use-cases/createEmployee.js';
import { UpdateEmployeeUseCase } from '../../application/use-cases/updateEmployee.js';
import { ActivateEmployeeUseCase } from '../../application/use-cases/activateEmployee.js';
import { DeactivateEmployeeUseCase } from '../../application/use-cases/deactivateEmployee.js';
import { EmployeeController } from './employee.controller.js';

// --- Composition root ---
const employeeRepository = new MongoEmployeeRepository();
const branchRepository = new MongoBranchRepository();

const controller = new EmployeeController({
    listEmployees: new ListEmployeesUseCase(employeeRepository, branchRepository),
    getEmployeeById: new GetEmployeeByIdUseCase(employeeRepository, branchRepository),
    createEmployee: new CreateEmployeeUseCase(employeeRepository, branchRepository),
    updateEmployee: new UpdateEmployeeUseCase(employeeRepository, branchRepository),
    activateEmployee: new ActivateEmployeeUseCase(employeeRepository, branchRepository),
    deactivateEmployee: new DeactivateEmployeeUseCase(employeeRepository, branchRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; la ownership
// check pasa por la misma cadena employee -> branch -> company.
const requireOwnCompanyEmployee = async (req, res, next) => {
    try {
        const branchIds = await branchRepository.findIdsByCompany(req.user.companyId);
        const doc = await EmployeeModel.findOne({ _id: req.params.id, branch: { $in: branchIds } }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Empleado no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const employeeAudit = {
    entityModel: EmployeeModel,
    snapshot: { fields: ['branch', 'firstName', 'lastName', 'email', 'phone', 'dui', 'position', 'isActive'] },
    compareFields: ['firstName', 'lastName', 'email', 'phone', 'dui', 'position', 'isActive']
};

// Fase 1 del plan de Flota (ERS v1.1, sección 4.6 — Encargado de Logística
// "administra conductores"). Mismo criterio que branches/warehouses:
// view/create/update/activate/deactivate, sin delete físico.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'employees.view',
        description: 'Listar empleados',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'employees.view',
        description: 'Obtener un empleado',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del empleado',
        handler: createEntityHistoryHandler(EmployeeModel.modelName, 'id'),
        middlewares: [requireOwnCompanyEmployee]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'employees.create',
        description: 'Crear nuevo empleado',
        handler: controller.create,
        middlewares: [logAction({ ...employeeAudit, action: 'create', resource: 'employees', responseKey: 'newEmployee' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'employees.update',
        description: 'Actualizar empleado',
        handler: controller.update,
        middlewares: [logAction({ ...employeeAudit, action: 'update', resource: 'employees', responseKey: 'employee' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'employees.activate',
        description: 'Activar empleado',
        handler: controller.activate,
        middlewares: [logAction({ ...employeeAudit, action: 'update', resource: 'employees', responseKey: 'employee' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'employees.deactivate',
        description: 'Desactivar empleado',
        handler: controller.deactivate,
        middlewares: [logAction({ ...employeeAudit, action: 'update', resource: 'employees', responseKey: 'employee' })]
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

export const employeeRoutes = routes;
export default router;
