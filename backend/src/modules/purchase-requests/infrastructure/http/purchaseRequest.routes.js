import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoPurchaseRequestDetailRepository } from '#modules/purchase-request-details/infrastructure/persistence/MongoPurchaseRequestDetailRepository.js';

import { PurchaseRequestModel } from '../persistence/purchaseRequestMongooseModel.js';
import { MongoPurchaseRequestRepository } from '../persistence/MongoPurchaseRequestRepository.js';
import { ListPurchaseRequestsUseCase } from '../../application/use-cases/listPurchaseRequests.js';
import { GetPurchaseRequestByIdUseCase } from '../../application/use-cases/getPurchaseRequestById.js';
import { CreatePurchaseRequestUseCase } from '../../application/use-cases/createPurchaseRequest.js';
import { UpdatePurchaseRequestUseCase } from '../../application/use-cases/updatePurchaseRequest.js';
import { SubmitPurchaseRequestUseCase } from '../../application/use-cases/submitPurchaseRequest.js';
import { ApprovePurchaseRequestUseCase } from '../../application/use-cases/approvePurchaseRequest.js';
import { RejectPurchaseRequestUseCase } from '../../application/use-cases/rejectPurchaseRequest.js';
import { CancelPurchaseRequestUseCase } from '../../application/use-cases/cancelPurchaseRequest.js';
import { PurchaseRequestController } from './purchaseRequest.controller.js';

// --- Composition root ---
const purchaseRequestRepository = new MongoPurchaseRequestRepository();
const branchRepository = new MongoBranchRepository();
const warehouseRepository = new MongoWarehouseRepository();
const purchaseRequestDetailRepository = new MongoPurchaseRequestDetailRepository();

const controller = new PurchaseRequestController({
    listPurchaseRequests: new ListPurchaseRequestsUseCase(purchaseRequestRepository),
    getPurchaseRequestById: new GetPurchaseRequestByIdUseCase(purchaseRequestRepository),
    createPurchaseRequest: new CreatePurchaseRequestUseCase(purchaseRequestRepository, branchRepository, warehouseRepository),
    updatePurchaseRequest: new UpdatePurchaseRequestUseCase(purchaseRequestRepository, branchRepository, warehouseRepository),
    submitPurchaseRequest: new SubmitPurchaseRequestUseCase(purchaseRequestRepository, purchaseRequestDetailRepository),
    approvePurchaseRequest: new ApprovePurchaseRequestUseCase(purchaseRequestRepository),
    rejectPurchaseRequest: new RejectPurchaseRequestUseCase(purchaseRequestRepository),
    cancelPurchaseRequest: new CancelPurchaseRequestUseCase(purchaseRequestRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// categories.routes.js/expenseType.routes.js.
const requireOwnCompanyPurchaseRequest = async (req, res, next) => {
    try {
        const doc = await PurchaseRequestModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Solicitud de compra no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const purchaseRequestAudit = {
    entityModel: PurchaseRequestModel,
    // populate en 'branch warehouse' para que el snapshot "antes" tenga la
    // misma forma (objeto poblado) que el "después", que sale de la
    // respuesta ya poblada por MongoPurchaseRequestRepository — si no,
    // diffFields marca falsos cambios (ObjectId vs objeto) en cada update.
    snapshot: { fields: ['company', 'code', 'branch', 'warehouse', 'user', 'requestDate', 'requiredDate', 'justification', 'status', 'notes'], populate: 'branch warehouse' },
    compareFields: ['branch', 'warehouse', 'requiredDate', 'justification', 'status', 'notes'],
    // PurchaseRequest no tiene campo `name`: usamos el código visible (SCR-00001).
    resolveEntityName: (entity) => entity.code,
};

// Módulo de Solicitudes de Compra (ERS v0.8, cap. 6.8) — cabecera del flujo
// Solicitud -> Cotización -> Orden. 1/4 módulos de Compras ya en developer
// (expense-types). Detalle de líneas vive en el módulo hermano
// purchase-request-details (mismo patrón que suppliers/supplier-contacts).
// Solo editable en estado draft; las transiciones de estado son endpoints
// explícitos (submit/approve/reject/cancel), igual que activate/deactivate
// en otros módulos.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'purchase_requests.view',
        description: 'Listar solicitudes de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'purchase_requests.view',
        description: 'Obtener una solicitud de compra',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la solicitud de compra',
        handler: createEntityHistoryHandler(PurchaseRequestModel.modelName, 'id'),
        middlewares: [requireOwnCompanyPurchaseRequest]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'purchase_requests.create',
        description: 'Crear solicitud de compra',
        handler: controller.create,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'create', resource: 'purchase_requests', responseKey: 'newPurchaseRequest' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'purchase_requests.update',
        description: 'Actualizar solicitud de compra',
        handler: controller.update,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'update', resource: 'purchase_requests', responseKey: 'purchaseRequest' })]
    },
    {
        method: 'PATCH',
        path: '/:id/submit',
        permission: 'purchase_requests.submit',
        description: 'Enviar solicitud de compra',
        handler: controller.submit,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'update', resource: 'purchase_requests', responseKey: 'purchaseRequest' })]
    },
    {
        method: 'PATCH',
        path: '/:id/approve',
        permission: 'purchase_requests.approve',
        description: 'Aprobar solicitud de compra',
        handler: controller.approve,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'update', resource: 'purchase_requests', responseKey: 'purchaseRequest' })]
    },
    {
        method: 'PATCH',
        path: '/:id/reject',
        permission: 'purchase_requests.reject',
        description: 'Rechazar solicitud de compra',
        handler: controller.reject,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'update', resource: 'purchase_requests', responseKey: 'purchaseRequest' })]
    },
    {
        method: 'PATCH',
        path: '/:id/cancel',
        permission: 'purchase_requests.cancel',
        description: 'Cancelar solicitud de compra',
        handler: controller.cancel,
        middlewares: [logAction({ ...purchaseRequestAudit, action: 'update', resource: 'purchase_requests', responseKey: 'purchaseRequest' })]
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

export const purchaseRequestRoutes = routes;
export default router;
