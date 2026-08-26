import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoGeoRepository } from '#modules/geo/infrastructure/persistence/MongoGeoRepository.js';

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

const controller = new CompanyController({
    listCompanies: new ListCompaniesUseCase(companyRepository),
    getCompanyById: new GetCompanyByIdUseCase(companyRepository),
    createCompany: new CreateCompanyUseCase(companyRepository, geoRepository),
    updateCompany: new UpdateCompanyUseCase(companyRepository, geoRepository),
    activateCompany: new ActivateCompanyUseCase(companyRepository),
    deactivateCompany: new DeactivateCompanyUseCase(companyRepository),
});

const router = Router();

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
        middlewares: []
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
