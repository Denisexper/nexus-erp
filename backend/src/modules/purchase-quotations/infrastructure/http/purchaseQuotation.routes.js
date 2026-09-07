import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoSupplierRepository } from '#modules/suppliers/infrastructure/persistence/MongoSupplierRepository.js';
import { MongoProductRepository } from '#modules/products/infrastructure/persistence/MongoProductRepository.js';
import { MongoUnitRepository } from '#modules/units/infrastructure/persistence/MongoUnitRepository.js';
import { MongoExpenseTypeRepository } from '#modules/expense-types/infrastructure/persistence/MongoExpenseTypeRepository.js';
import { MongoPurchaseRequestRepository } from '#modules/purchase-requests/infrastructure/persistence/MongoPurchaseRequestRepository.js';
import { MongoPurchaseRequestDetailRepository } from '#modules/purchase-request-details/infrastructure/persistence/MongoPurchaseRequestDetailRepository.js';

import { PurchaseQuotationModel } from '../persistence/purchaseQuotationMongooseModel.js';
import { MongoPurchaseQuotationRepository } from '../persistence/MongoPurchaseQuotationRepository.js';
import { ListPurchaseQuotationsUseCase } from '../../application/use-cases/listPurchaseQuotations.js';
import { GetPurchaseQuotationByIdUseCase } from '../../application/use-cases/getPurchaseQuotationById.js';
import { CreatePurchaseQuotationUseCase } from '../../application/use-cases/createPurchaseQuotation.js';
import { UpdatePurchaseQuotationUseCase } from '../../application/use-cases/updatePurchaseQuotation.js';
import { RejectPurchaseQuotationUseCase } from '../../application/use-cases/rejectPurchaseQuotation.js';
import { CancelPurchaseQuotationUseCase } from '../../application/use-cases/cancelPurchaseQuotation.js';
import { GetPurchaseQuotationsComparisonUseCase } from '../../application/use-cases/getPurchaseQuotationsComparison.js';
import { PurchaseQuotationController } from './purchaseQuotation.controller.js';

// --- Composition root ---
const purchaseQuotationRepository = new MongoPurchaseQuotationRepository();
const supplierRepository = new MongoSupplierRepository();
const productRepository = new MongoProductRepository();
const unitRepository = new MongoUnitRepository();
const expenseTypeRepository = new MongoExpenseTypeRepository();
const purchaseRequestRepository = new MongoPurchaseRequestRepository();
const purchaseRequestDetailRepository = new MongoPurchaseRequestDetailRepository();

const controller = new PurchaseQuotationController({
    listPurchaseQuotations: new ListPurchaseQuotationsUseCase(purchaseQuotationRepository),
    getPurchaseQuotationById: new GetPurchaseQuotationByIdUseCase(purchaseQuotationRepository),
    createPurchaseQuotation: new CreatePurchaseQuotationUseCase(
        purchaseQuotationRepository,
        supplierRepository,
        productRepository,
        unitRepository,
        expenseTypeRepository,
        purchaseRequestRepository,
        purchaseRequestDetailRepository,
    ),
    updatePurchaseQuotation: new UpdatePurchaseQuotationUseCase(purchaseQuotationRepository),
    rejectPurchaseQuotation: new RejectPurchaseQuotationUseCase(purchaseQuotationRepository),
    cancelPurchaseQuotation: new CancelPurchaseQuotationUseCase(purchaseQuotationRepository),
    getPurchaseQuotationsComparison: new GetPurchaseQuotationsComparisonUseCase(
        purchaseQuotationRepository,
        purchaseRequestRepository,
        purchaseRequestDetailRepository,
    ),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// purchase-requests/expenseType.routes.js.
const requireOwnCompanyPurchaseQuotation = async (req, res, next) => {
    try {
        const doc = await PurchaseQuotationModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Cotización de compra no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const purchaseQuotationAudit = {
    entityModel: PurchaseQuotationModel,
    snapshot: {
        fields: ['company', 'code', 'supplier', 'quotationDate', 'validUntil', 'currency', 'paymentTerms', 'deliveryDays', 'subtotal', 'discount', 'tax', 'additionalExpenses', 'total', 'status', 'notes'],
        populate: 'supplier',
    },
    compareFields: ['validUntil', 'currency', 'paymentTerms', 'deliveryDays', 'status', 'notes'],
    // PurchaseQuotation no tiene campo `name`: usamos el código visible (COT-00001).
    resolveEntityName: (entity) => entity.code,
};

// Módulo de Cotizaciones de Compra (ERS v0.8, cap. 6.8) — 3/4 módulos de
// Compras. La cotización se registra completa en un solo POST (cabecera +
// líneas + gastos + trazabilidad hacia las solicitudes de origen): las
// tablas puente (purchase_quotation_requests / ..._request_details) no
// tienen CRUD propio, se arman solas dentro de createPurchaseQuotation.
// Igual que en purchase-requests, solo se puede editar información de
// cabecera mientras el estado es 'received'; rechazar/cancelar son
// endpoints explícitos.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'purchase_quotations.view',
        description: 'Listar cotizaciones de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/comparison/:purchaseRequestId',
        permission: 'purchase_quotations.view',
        description: 'Comparar cotizaciones recibidas para una solicitud de compra',
        handler: controller.getComparison,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'purchase_quotations.view',
        description: 'Obtener una cotización de compra',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la cotización de compra',
        handler: createEntityHistoryHandler(PurchaseQuotationModel.modelName, 'id'),
        middlewares: [requireOwnCompanyPurchaseQuotation]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'purchase_quotations.create',
        description: 'Registrar cotización de compra',
        handler: controller.create,
        middlewares: [logAction({ ...purchaseQuotationAudit, action: 'create', resource: 'purchase_quotations', responseKey: 'newPurchaseQuotation' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'purchase_quotations.update',
        description: 'Actualizar cotización de compra',
        handler: controller.update,
        middlewares: [logAction({ ...purchaseQuotationAudit, action: 'update', resource: 'purchase_quotations', responseKey: 'purchaseQuotation' })]
    },
    {
        method: 'PATCH',
        path: '/:id/reject',
        permission: 'purchase_quotations.reject',
        description: 'Rechazar cotización de compra',
        handler: controller.reject,
        middlewares: [logAction({ ...purchaseQuotationAudit, action: 'update', resource: 'purchase_quotations', responseKey: 'purchaseQuotation' })]
    },
    {
        method: 'PATCH',
        path: '/:id/cancel',
        permission: 'purchase_quotations.cancel',
        description: 'Cancelar cotización de compra',
        handler: controller.cancel,
        middlewares: [logAction({ ...purchaseQuotationAudit, action: 'update', resource: 'purchase_quotations', responseKey: 'purchaseQuotation' })]
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

export const purchaseQuotationRoutes = routes;
export default router;
