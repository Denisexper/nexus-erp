import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoGeoRepository } from '#modules/geo/infrastructure/persistence/MongoGeoRepository.js';
import { seedRolesForCompany } from '#modules/roles/infrastructure/seed/seedRoles.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoLocationRepository } from '#modules/locations/infrastructure/persistence/MongoLocationRepository.js';
import { MongoKardexRepository } from '#modules/kardex/infrastructure/persistence/MongoKardexRepository.js';
import { DeactivateWarehouseUseCase } from '#modules/warehouses/application/use-cases/deactivateWarehouse.js';
import { DeactivateBranchUseCase } from '#modules/branches/application/use-cases/deactivateBranch.js';
import { ActivateWarehouseUseCase } from '#modules/warehouses/application/use-cases/activateWarehouse.js';
import { ActivateBranchUseCase } from '#modules/branches/application/use-cases/activateBranch.js';

import { CompanyModel } from '../persistence/companyMongooseModel.js';
import { MongoCompanyRepository } from '../persistence/MongoCompanyRepository.js';
import { ListCompaniesUseCase } from '../../application/use-cases/listCompanies.js';
import { GetCompanyByIdUseCase } from '../../application/use-cases/getCompanyById.js';
import { CreateCompanyUseCase } from '../../application/use-cases/createCompany.js';
import { UpdateCompanyUseCase } from '../../application/use-cases/updateCompany.js';
import { ActivateCompanyUseCase } from '../../application/use-cases/activateCompany.js';
import { DeactivateCompanyUseCase } from '../../application/use-cases/deactivateCompany.js';
import { CompanyController } from './company.controller.js';

// --- Composition root: aquí, y solo aquí, se conectan las piezas concretas ---
// (Mongo) con las abstractas (casos de uso, controller). Nada fuera de este
// archivo sabe que el repositorio real es MongoCompanyRepository.
const companyRepository = new MongoCompanyRepository();
const geoRepository = new MongoGeoRepository();
const branchRepository = new MongoBranchRepository();
const warehouseRepository = new MongoWarehouseRepository();
const locationRepository = new MongoLocationRepository();
const kardexRepository = new MongoKardexRepository();

// Cascada completa RN-EMP-005: empresa -> sucursales -> almacenes ->
// ubicaciones, reusando los mismos casos de uso que branches/warehouses (en
// ambos sentidos: desactivar y reactivar).
const deactivateWarehouseUseCase = new DeactivateWarehouseUseCase(warehouseRepository, branchRepository, locationRepository, kardexRepository);
const deactivateBranchUseCase = new DeactivateBranchUseCase(branchRepository, warehouseRepository, deactivateWarehouseUseCase);
const activateWarehouseUseCase = new ActivateWarehouseUseCase(warehouseRepository, branchRepository, locationRepository);
const activateBranchUseCase = new ActivateBranchUseCase(branchRepository, warehouseRepository, activateWarehouseUseCase);

const controller = new CompanyController({
    listCompanies: new ListCompaniesUseCase(companyRepository),
    getCompanyById: new GetCompanyByIdUseCase(companyRepository),
    createCompany: new CreateCompanyUseCase(companyRepository, geoRepository, seedRolesForCompany),
    updateCompany: new UpdateCompanyUseCase(companyRepository, geoRepository),
    activateCompany: new ActivateCompanyUseCase(companyRepository, branchRepository, activateBranchUseCase),
    deactivateCompany: new DeactivateCompanyUseCase(companyRepository, branchRepository, deactivateBranchUseCase),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá antes de llegar
// a él en vez de tocar el handler compartido.
const requireOwnCompany = (req, res, next) => {
    if (req.params.id !== req.user.companyId) {
        return res.status(404).json({ msj: 'Empresa no encontrada' });
    }
    next();
};

// Config de auditoría compartida por las rutas de empresas
const COMPANY_AUDIT_FIELDS = [
    'name', 'commercialName', 'slug', 'nit', 'nrc',
    'commercialLine1', 'commercialLine2', 'commercialLine3',
    'address', 'department', 'municipality', 'district',
    'phone', 'email', 'webSite', 'logo', 'isActive'
];

const companyAudit = {
    entityModel: CompanyModel,
    snapshot: { fields: COMPANY_AUDIT_FIELDS, populate: ['department', 'municipality', 'district'] },
    compareFields: COMPANY_AUDIT_FIELDS
};

// rutas con metadata. Nota: el ERS define companies.view/create/update/
// activate/deactivate como permisos SEPARADOS (ver 6.3.7) — no hay
// companies.delete (por eso no hay DELETE físico), y activar/desactivar
// son dos endpoints con su propio permiso, no un solo toggle bajo `update`.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'companies.read',
        description: 'Listar empresas',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'companies.read',
        description: 'Obtener una empresa',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la empresa',
        handler: createEntityHistoryHandler(CompanyModel.modelName, 'id'),
        middlewares: [requireOwnCompany]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'companies.create',
        description: 'Crear nueva empresa',
        handler: controller.create,
        middlewares: [logAction({ ...companyAudit, action: 'create', resource: 'companies', responseKey: 'newCompany' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'companies.update',
        description: 'Actualizar empresa',
        handler: controller.update,
        middlewares: [logAction({ ...companyAudit, action: 'update', resource: 'companies', responseKey: 'company' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'companies.activate',
        description: 'Activar empresa',
        handler: controller.activate,
        middlewares: [logAction({ ...companyAudit, action: 'update', resource: 'companies', responseKey: 'company' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'companies.deactivate',
        description: 'Desactivar empresa',
        handler: controller.deactivate,
        middlewares: [logAction({ ...companyAudit, action: 'update', resource: 'companies', responseKey: 'company' })]
    }
];

// registrar rutas automáticamente
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

// exportar metadata para auto-discovery
export const companyRoutes = routes;

// exportar router para usar en server.js
export default router;
