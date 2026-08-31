import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoSupplierRepository } from '#modules/suppliers/infrastructure/persistence/MongoSupplierRepository.js';

import { SupplierContactModel } from '../persistence/supplierContactMongooseModel.js';
import { MongoSupplierContactRepository } from '../persistence/MongoSupplierContactRepository.js';
import { ListSupplierContactsUseCase } from '../../application/use-cases/listSupplierContacts.js';
import { GetSupplierContactByIdUseCase } from '../../application/use-cases/getSupplierContactById.js';
import { CreateSupplierContactUseCase } from '../../application/use-cases/createSupplierContact.js';
import { UpdateSupplierContactUseCase } from '../../application/use-cases/updateSupplierContact.js';
import { ActivateSupplierContactUseCase } from '../../application/use-cases/activateSupplierContact.js';
import { DeactivateSupplierContactUseCase } from '../../application/use-cases/deactivateSupplierContact.js';
import { SupplierContactController } from './supplierContact.controller.js';

// --- Composition root ---
const supplierContactRepository = new MongoSupplierContactRepository();
const supplierRepository = new MongoSupplierRepository();

const controller = new SupplierContactController({
    listSupplierContacts: new ListSupplierContactsUseCase(supplierContactRepository, supplierRepository),
    getSupplierContactById: new GetSupplierContactByIdUseCase(supplierContactRepository, supplierRepository),
    createSupplierContact: new CreateSupplierContactUseCase(supplierContactRepository, supplierRepository),
    updateSupplierContact: new UpdateSupplierContactUseCase(supplierContactRepository, supplierRepository),
    activateSupplierContact: new ActivateSupplierContactUseCase(supplierContactRepository, supplierRepository),
    deactivateSupplierContact: new DeactivateSupplierContactUseCase(supplierContactRepository, supplierRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; ownership se
// valida acá recorriendo supplierContact -> supplier -> company.
const requireOwnCompanySupplierContact = async (req, res, next) => {
    try {
        const doc = await SupplierContactModel.findById(req.params.id).select('supplier').populate({ path: 'supplier', select: 'company' });
        if (!doc || String(doc.supplier?.company) !== String(req.user.companyId)) {
            return res.status(404).json({ msj: 'Contacto de proveedor no encontrado' });
        }
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const supplierContactAudit = {
    entityModel: SupplierContactModel,
    snapshot: { fields: ['supplier', 'fullName', 'phone', 'email', 'isActive'], populate: 'supplier' },
    compareFields: ['fullName', 'phone', 'email', 'isActive']
};

// Contactos de proveedor, sin sección propia en el ERS v0.5 (llega solo
// hasta el capítulo 6.5). Construido a partir del diagrama de BD de Denis.
// FK obligatoria a `suppliers`, fija al crear (no editable, igual que
// warehouse->branch/location->warehouse). "Consulta por proveedor" se
// resuelve con GET /supplier-contacts?supplier=<id>.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'supplier_contacts.view',
        description: 'Listar contactos de proveedor',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'supplier_contacts.view',
        description: 'Obtener un contacto de proveedor',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del contacto de proveedor',
        handler: createEntityHistoryHandler(SupplierContactModel.modelName, 'id'),
        middlewares: [requireOwnCompanySupplierContact]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'supplier_contacts.create',
        description: 'Crear contacto de proveedor',
        handler: controller.create,
        middlewares: [logAction({ ...supplierContactAudit, action: 'create', resource: 'supplier_contacts', responseKey: 'newSupplierContact' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'supplier_contacts.update',
        description: 'Actualizar contacto de proveedor',
        handler: controller.update,
        middlewares: [logAction({ ...supplierContactAudit, action: 'update', resource: 'supplier_contacts', responseKey: 'supplierContact' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'supplier_contacts.activate',
        description: 'Activar contacto de proveedor',
        handler: controller.activate,
        middlewares: [logAction({ ...supplierContactAudit, action: 'update', resource: 'supplier_contacts', responseKey: 'supplierContact' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'supplier_contacts.deactivate',
        description: 'Desactivar contacto de proveedor',
        handler: controller.deactivate,
        middlewares: [logAction({ ...supplierContactAudit, action: 'update', resource: 'supplier_contacts', responseKey: 'supplierContact' })]
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

export const supplierContactRoutes = routes;
export default router;
