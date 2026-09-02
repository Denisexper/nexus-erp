import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoGeoRepository } from '#modules/geo/infrastructure/persistence/MongoGeoRepository.js';
import { MongoCompanyRepository } from '#modules/companies/infrastructure/persistence/MongoCompanyRepository.js';

import { BranchModel } from '../persistence/branchMongooseModel.js';
import { MongoBranchRepository } from '../persistence/MongoBranchRepository.js';
import { ListBranchesUseCase } from '../../application/use-cases/listBranches.js';
import { GetBranchByIdUseCase } from '../../application/use-cases/getBranchById.js';
import { CreateBranchUseCase } from '../../application/use-cases/createBranch.js';
import { UpdateBranchUseCase } from '../../application/use-cases/updateBranch.js';
import { ActivateBranchUseCase } from '../../application/use-cases/activateBranch.js';
import { DeactivateBranchUseCase } from '../../application/use-cases/deactivateBranch.js';
import { BranchController } from './branch.controller.js';

// --- Composition root ---
const branchRepository = new MongoBranchRepository();
const companyRepository = new MongoCompanyRepository();
const geoRepository = new MongoGeoRepository();

const controller = new BranchController({
    listBranches: new ListBranchesUseCase(branchRepository),
    getBranchById: new GetBranchByIdUseCase(branchRepository),
    createBranch: new CreateBranchUseCase(branchRepository, companyRepository, geoRepository),
    updateBranch: new UpdateBranchUseCase(branchRepository, geoRepository),
    activateBranch: new ActivateBranchUseCase(branchRepository),
    deactivateBranch: new DeactivateBranchUseCase(branchRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// companies.routes.js / user.routes.js.
const requireOwnCompanyBranch = async (req, res, next) => {
    try {
        const doc = await BranchModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Sucursal no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const BRANCH_AUDIT_FIELDS = ['name', 'address', 'department', 'municipality', 'district', 'phone', 'email', 'isActive'];

const branchAudit = {
    entityModel: BranchModel,
    snapshot: { fields: ['company', ...BRANCH_AUDIT_FIELDS], populate: ['department', 'municipality', 'district'] },
    compareFields: BRANCH_AUDIT_FIELDS
};

// rutas con metadata. Mismo criterio que companies: view/create/update/
// activate/deactivate como permisos separados (ERS 6.4.7), sin delete físico
// (RN-BRA-003 sobre "no eliminar sucursal con almacenes" queda sin efecto
// práctico porque no hay endpoint de borrado).
// "Consultar sucursales por empresa" (CU-033) ya no acepta un `company` en
// la query: siempre se resuelve con la company del JWT (req.user.companyId).
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'branches.view',
        description: 'Listar sucursales',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'branches.view',
        description: 'Obtener una sucursal',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la sucursal',
        handler: createEntityHistoryHandler(BranchModel.modelName, 'id'),
        middlewares: [requireOwnCompanyBranch]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'branches.create',
        description: 'Crear nueva sucursal',
        handler: controller.create,
        middlewares: [logAction({ ...branchAudit, action: 'create', resource: 'branches', responseKey: 'newBranch' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'branches.update',
        description: 'Actualizar sucursal',
        handler: controller.update,
        middlewares: [logAction({ ...branchAudit, action: 'update', resource: 'branches', responseKey: 'branch' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'branches.activate',
        description: 'Activar sucursal',
        handler: controller.activate,
        middlewares: [logAction({ ...branchAudit, action: 'update', resource: 'branches', responseKey: 'branch' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'branches.deactivate',
        description: 'Desactivar sucursal',
        handler: controller.deactivate,
        middlewares: [logAction({ ...branchAudit, action: 'update', resource: 'branches', responseKey: 'branch' })]
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

export const branchRoutes = routes;
export default router;
