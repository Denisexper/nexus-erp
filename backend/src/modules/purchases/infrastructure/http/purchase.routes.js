import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoPurchaseOrderRepository } from '#modules/purchase-orders/infrastructure/persistence/MongoPurchaseOrderRepository.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';

import { PurchaseModel } from '../persistence/purchaseMongooseModel.js';
import { MongoPurchaseRepository } from '../persistence/MongoPurchaseRepository.js';
import { ListPurchasesUseCase } from '../../application/use-cases/listPurchases.js';
import { GetPurchaseByIdUseCase } from '../../application/use-cases/getPurchaseById.js';
import { CreatePurchaseUseCase } from '../../application/use-cases/createPurchase.js';
import { CancelPurchaseUseCase } from '../../application/use-cases/cancelPurchase.js';
import { PurchaseController } from './purchase.controller.js';

// --- Composition root ---
const purchaseRepository = new MongoPurchaseRepository();
const purchaseOrderRepository = new MongoPurchaseOrderRepository();
const branchRepository = new MongoBranchRepository();

const controller = new PurchaseController({
    listPurchases: new ListPurchasesUseCase(purchaseRepository),
    getPurchaseById: new GetPurchaseByIdUseCase(purchaseRepository),
    createPurchase: new CreatePurchaseUseCase(purchaseRepository, purchaseOrderRepository, branchRepository),
    cancelPurchase: new CancelPurchaseUseCase(purchaseRepository, purchaseOrderRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// purchase-orders/purchaseOrder.routes.js.
const requireOwnCompanyPurchase = async (req, res, next) => {
    try {
        const doc = await PurchaseModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Compra no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const purchaseAudit = {
    entityModel: PurchaseModel,
    snapshot: {
        fields: ['company', 'code', 'purchaseOrder', 'supplier', 'branch', 'warehouse', 'supplierInvoiceNumber', 'currency', 'subtotal', 'discount', 'tax', 'total', 'status', 'notes'],
        populate: 'supplier',
    },
    compareFields: ['status', 'notes'],
    // Purchase no tiene campo `name`: usamos el código visible (C-00001).
    resolveEntityName: (entity) => entity.code,
};

// Módulo de Recepción / Compras (ERS v0.9, cap. 6.8.21-6.8.25). Registra lo
// realmente recibido contra una orden aprobada, admitiendo recepción
// parcial en múltiples compras. Sin edición ni endpoint de "verificar"
// todavía (el ERS deja esos estados como preparación para etapas
// posteriores) — solo crear, listar, consultar y cancelar una compra recién
// registrada.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'purchases.view',
        description: 'Listar compras (recepciones)',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'purchases.view',
        description: 'Obtener una compra',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la compra',
        handler: createEntityHistoryHandler(PurchaseModel.modelName, 'id'),
        middlewares: [requireOwnCompanyPurchase]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'purchases.create',
        description: 'Registrar compra (recepción) contra una orden',
        handler: controller.create,
        middlewares: [logAction({ ...purchaseAudit, action: 'create', resource: 'purchases', responseKey: 'newPurchase' })]
    },
    {
        method: 'PATCH',
        path: '/:id/cancel',
        permission: 'purchases.cancel',
        description: 'Cancelar una compra recién registrada',
        handler: controller.cancel,
        middlewares: [logAction({ ...purchaseAudit, action: 'update', resource: 'purchases', responseKey: 'purchase' })]
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

export const purchaseRoutes = routes;
export default router;
