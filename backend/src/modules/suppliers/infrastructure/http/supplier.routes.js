import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoCountryRepository } from '#modules/countries/infrastructure/persistence/MongoCountryRepository.js';

import { SupplierModel } from '../persistence/supplierMongooseModel.js';
import { MongoSupplierRepository } from '../persistence/MongoSupplierRepository.js';
import { ListSuppliersUseCase } from '../../application/use-cases/listSuppliers.js';
import { GetSupplierByIdUseCase } from '../../application/use-cases/getSupplierById.js';
import { CreateSupplierUseCase } from '../../application/use-cases/createSupplier.js';
import { UpdateSupplierUseCase } from '../../application/use-cases/updateSupplier.js';
import { ActivateSupplierUseCase } from '../../application/use-cases/activateSupplier.js';
import { DeactivateSupplierUseCase } from '../../application/use-cases/deactivateSupplier.js';
import { SupplierController } from './supplier.controller.js';

// --- Composition root ---
const supplierRepository = new MongoSupplierRepository();
const countryRepository = new MongoCountryRepository();

const controller = new SupplierController({
    listSuppliers: new ListSuppliersUseCase(supplierRepository),
    getSupplierById: new GetSupplierByIdUseCase(supplierRepository),
    createSupplier: new CreateSupplierUseCase(supplierRepository, countryRepository),
    updateSupplier: new UpdateSupplierUseCase(supplierRepository, countryRepository),
    activateSupplier: new ActivateSupplierUseCase(supplierRepository),
    deactivateSupplier: new DeactivateSupplierUseCase(supplierRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; ownership se
// valida acá, igual que en branches.routes.js.
const requireOwnCompanySupplier = async (req, res, next) => {
    try {
        const doc = await SupplierModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Proveedor no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const SUPPLIER_AUDIT_FIELDS = ['code', 'country', 'name', 'address', 'phone', 'email', 'website', 'isActive'];

const supplierAudit = {
    entityModel: SupplierModel,
    snapshot: { fields: ['company', ...SUPPLIER_AUDIT_FIELDS], populate: ['country'] },
    compareFields: SUPPLIER_AUDIT_FIELDS
};

// Proveedores: construido originalmente a partir del diagrama de BD de
// Denis (sin sección propia en el ERS v0.5, que llegaba solo hasta el
// capítulo 6.5). El ERS v0.6 agregó el capítulo 6.6 "Proveedores y
// Contactos de Proveedores" con RN-SUP-001 a 013 — de ahí salieron `code`
// (RN-SUP-002: obligatorio y único) y `website` (RN-SUP-012: formato de
// URL) como campos oficiales que el diagrama original no mostraba. FK
// obligatoria a `countries`, editable (no es una relación de identidad como
// branch->company, es un dato del proveedor, igual que el departamento en
// companies). Sin unicidad de nombre: ni el diagrama ni el ERS lo marcan
// como llave. "Consulta por país" se resuelve con GET /suppliers?country=<id>.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'suppliers.view',
        description: 'Listar proveedores',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'suppliers.view',
        description: 'Obtener un proveedor',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del proveedor',
        handler: createEntityHistoryHandler(SupplierModel.modelName, 'id'),
        middlewares: [requireOwnCompanySupplier]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'suppliers.create',
        description: 'Crear proveedor',
        handler: controller.create,
        middlewares: [logAction({ ...supplierAudit, action: 'create', resource: 'suppliers', responseKey: 'newSupplier' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'suppliers.update',
        description: 'Actualizar proveedor',
        handler: controller.update,
        middlewares: [logAction({ ...supplierAudit, action: 'update', resource: 'suppliers', responseKey: 'supplier' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'suppliers.activate',
        description: 'Activar proveedor',
        handler: controller.activate,
        middlewares: [logAction({ ...supplierAudit, action: 'update', resource: 'suppliers', responseKey: 'supplier' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'suppliers.deactivate',
        description: 'Desactivar proveedor',
        handler: controller.deactivate,
        middlewares: [logAction({ ...supplierAudit, action: 'update', resource: 'suppliers', responseKey: 'supplier' })]
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

export const supplierRoutes = routes;
export default router;
