import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoPurchaseQuotationRepository } from '#modules/purchase-quotations/infrastructure/persistence/MongoPurchaseQuotationRepository.js';
import { MongoBranchRepository } from '#modules/branches/infrastructure/persistence/MongoBranchRepository.js';
import { MongoWarehouseRepository } from '#modules/warehouses/infrastructure/persistence/MongoWarehouseRepository.js';
import { MongoPurchaseRequestRepository } from '#modules/purchase-requests/infrastructure/persistence/MongoPurchaseRequestRepository.js';
import { MongoPurchaseRequestDetailRepository } from '#modules/purchase-request-details/infrastructure/persistence/MongoPurchaseRequestDetailRepository.js';
import { MongoExpenseTypeRepository } from '#modules/expense-types/infrastructure/persistence/MongoExpenseTypeRepository.js';

import { PurchaseOrderModel } from '../persistence/purchaseOrderMongooseModel.js';
import { MongoPurchaseOrderRepository } from '../persistence/MongoPurchaseOrderRepository.js';
import { ListPurchaseOrdersUseCase } from '../../application/use-cases/listPurchaseOrders.js';
import { GetPurchaseOrderByIdUseCase } from '../../application/use-cases/getPurchaseOrderById.js';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/createPurchaseOrder.js';
import { UpdatePurchaseOrderUseCase } from '../../application/use-cases/updatePurchaseOrder.js';
import { ApprovePurchaseOrderUseCase } from '../../application/use-cases/approvePurchaseOrder.js';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/cancelPurchaseOrder.js';
import { AddPurchaseOrderExpenseUseCase } from '../../application/use-cases/addPurchaseOrderExpense.js';
import { GetPurchaseOrderTraceabilityUseCase } from '../../application/use-cases/getPurchaseOrderTraceability.js';
import { PurchaseOrderController } from './purchaseOrder.controller.js';

// --- Composition root ---
const purchaseOrderRepository = new MongoPurchaseOrderRepository();
const purchaseQuotationRepository = new MongoPurchaseQuotationRepository();
const branchRepository = new MongoBranchRepository();
const warehouseRepository = new MongoWarehouseRepository();
const purchaseRequestRepository = new MongoPurchaseRequestRepository();
const purchaseRequestDetailRepository = new MongoPurchaseRequestDetailRepository();
const expenseTypeRepository = new MongoExpenseTypeRepository();

const controller = new PurchaseOrderController({
    listPurchaseOrders: new ListPurchaseOrdersUseCase(purchaseOrderRepository),
    getPurchaseOrderById: new GetPurchaseOrderByIdUseCase(purchaseOrderRepository),
    createPurchaseOrder: new CreatePurchaseOrderUseCase(
        purchaseOrderRepository,
        purchaseQuotationRepository,
        branchRepository,
        warehouseRepository,
        purchaseRequestRepository,
        purchaseRequestDetailRepository,
    ),
    updatePurchaseOrder: new UpdatePurchaseOrderUseCase(purchaseOrderRepository, branchRepository, warehouseRepository),
    approvePurchaseOrder: new ApprovePurchaseOrderUseCase(purchaseOrderRepository),
    cancelPurchaseOrder: new CancelPurchaseOrderUseCase(purchaseOrderRepository, purchaseQuotationRepository),
    addPurchaseOrderExpense: new AddPurchaseOrderExpenseUseCase(purchaseOrderRepository, expenseTypeRepository),
    getPurchaseOrderTraceability: new GetPurchaseOrderTraceabilityUseCase(purchaseOrderRepository, purchaseQuotationRepository, purchaseRequestRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// purchase-quotations/purchaseQuotation.routes.js.
const requireOwnCompanyPurchaseOrder = async (req, res, next) => {
    try {
        const doc = await PurchaseOrderModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Orden de compra no encontrada' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const purchaseOrderAudit = {
    entityModel: PurchaseOrderModel,
    snapshot: {
        fields: ['company', 'code', 'supplier', 'branch', 'warehouse', 'purchaseQuotation', 'expectedDate', 'currency', 'paymentTerms', 'subtotal', 'discount', 'tax', 'additionalExpenses', 'total', 'status', 'notes'],
        populate: 'supplier',
    },
    compareFields: ['branch', 'warehouse', 'expectedDate', 'currency', 'paymentTerms', 'status', 'notes'],
    // PurchaseOrder no tiene campo `name`: usamos el código visible (OC-00001).
    resolveEntityName: (entity) => entity.code,
};

// Módulo de Órdenes de Compra (ERS v0.8, cap. 6.8) — 4/4 y último módulo de
// Compras de esta etapa. La orden se genera copiando íntegramente una
// cotización recibida (cabecera + líneas + gastos): no hay tabla puente entre
// purchase_order_details y purchase_quotation_details en el modelo del ERS,
// así que no admite selección parcial de líneas. Al crearse, la cotización de
// origen pasa a 'selected' y las solicitudes que la originaron avanzan a
// partially_ordered/completed. Solo se puede editar cabecera mientras el
// estado es 'draft'; aprobar/cancelar son endpoints explícitos, y registrar
// gastos (CU-086) queda habilitado mientras la orden siga activa.
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'purchase_orders.view',
        description: 'Listar órdenes de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'purchase_orders.view',
        description: 'Obtener una orden de compra',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/traceability',
        permission: 'purchase_orders.view',
        description: 'Consultar trazabilidad de la orden de compra (CU-087)',
        handler: controller.getTraceability,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la orden de compra',
        handler: createEntityHistoryHandler(PurchaseOrderModel.modelName, 'id'),
        middlewares: [requireOwnCompanyPurchaseOrder]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'purchase_orders.create',
        description: 'Crear orden de compra',
        handler: controller.create,
        middlewares: [logAction({ ...purchaseOrderAudit, action: 'create', resource: 'purchase_orders', responseKey: 'newPurchaseOrder' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'purchase_orders.update',
        description: 'Actualizar orden de compra',
        handler: controller.update,
        middlewares: [logAction({ ...purchaseOrderAudit, action: 'update', resource: 'purchase_orders', responseKey: 'purchaseOrder' })]
    },
    {
        method: 'POST',
        path: '/:id/expenses',
        permission: 'purchase_orders.update',
        description: 'Registrar gasto de la orden de compra',
        handler: controller.addExpense,
        middlewares: [logAction({ ...purchaseOrderAudit, action: 'update', resource: 'purchase_orders', responseKey: 'purchaseOrder' })]
    },
    {
        method: 'PATCH',
        path: '/:id/approve',
        permission: 'purchase_orders.approve',
        description: 'Aprobar orden de compra',
        handler: controller.approve,
        middlewares: [logAction({ ...purchaseOrderAudit, action: 'update', resource: 'purchase_orders', responseKey: 'purchaseOrder' })]
    },
    {
        method: 'PATCH',
        path: '/:id/cancel',
        permission: 'purchase_orders.cancel',
        description: 'Cancelar orden de compra',
        handler: controller.cancel,
        middlewares: [logAction({ ...purchaseOrderAudit, action: 'update', resource: 'purchase_orders', responseKey: 'purchaseOrder' })]
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

export const purchaseOrderRoutes = routes;
export default router;
