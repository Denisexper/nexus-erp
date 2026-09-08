import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoPurchaseRequestRepository } from '#modules/purchase-requests/infrastructure/persistence/MongoPurchaseRequestRepository.js';
import { MongoProductRepository } from '#modules/products/infrastructure/persistence/MongoProductRepository.js';
import { MongoUnitRepository } from '#modules/units/infrastructure/persistence/MongoUnitRepository.js';

import { PurchaseRequestDetailModel } from '../persistence/purchaseRequestDetailMongooseModel.js';
import { MongoPurchaseRequestDetailRepository } from '../persistence/MongoPurchaseRequestDetailRepository.js';
import { ListPurchaseRequestDetailsUseCase } from '../../application/use-cases/listPurchaseRequestDetails.js';
import { GetPurchaseRequestDetailByIdUseCase } from '../../application/use-cases/getPurchaseRequestDetailById.js';
import { CreatePurchaseRequestDetailUseCase } from '../../application/use-cases/createPurchaseRequestDetail.js';
import { UpdatePurchaseRequestDetailUseCase } from '../../application/use-cases/updatePurchaseRequestDetail.js';
import { DeletePurchaseRequestDetailUseCase } from '../../application/use-cases/deletePurchaseRequestDetail.js';
import { PurchaseRequestDetailController } from './purchaseRequestDetail.controller.js';

// --- Composition root ---
const purchaseRequestDetailRepository = new MongoPurchaseRequestDetailRepository();
const purchaseRequestRepository = new MongoPurchaseRequestRepository();
const productRepository = new MongoProductRepository();
const unitRepository = new MongoUnitRepository();

const controller = new PurchaseRequestDetailController({
    listPurchaseRequestDetails: new ListPurchaseRequestDetailsUseCase(purchaseRequestDetailRepository, purchaseRequestRepository),
    getPurchaseRequestDetailById: new GetPurchaseRequestDetailByIdUseCase(purchaseRequestDetailRepository, purchaseRequestRepository),
    createPurchaseRequestDetail: new CreatePurchaseRequestDetailUseCase(purchaseRequestDetailRepository, purchaseRequestRepository, productRepository, unitRepository),
    updatePurchaseRequestDetail: new UpdatePurchaseRequestDetailUseCase(purchaseRequestDetailRepository, purchaseRequestRepository, productRepository, unitRepository),
    deletePurchaseRequestDetail: new DeletePurchaseRequestDetailUseCase(purchaseRequestDetailRepository, purchaseRequestRepository),
});

const router = Router();

// El handler de historial es genérico y no filtra por tenant; ownership se
// valida acá recorriendo purchaseRequestDetail -> purchaseRequest -> company
// (mismo patrón que supplierContact -> supplier -> company).
const requireOwnCompanyPurchaseRequestDetail = async (req, res, next) => {
    try {
        const doc = await PurchaseRequestDetailModel.findById(req.params.id)
            .select('purchaseRequest')
            .populate({ path: 'purchaseRequest', select: 'company' });
        if (!doc || String(doc.purchaseRequest?.company) !== String(req.user.companyId)) {
            return res.status(404).json({ msj: 'Línea de solicitud no encontrada' });
        }
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const purchaseRequestDetailAudit = {
    entityModel: PurchaseRequestDetailModel,
    snapshot: { fields: ['purchaseRequest', 'product', 'quantity', 'unit', 'description', 'notes'], populate: 'product unit' },
    compareFields: ['product', 'quantity', 'unit', 'description', 'notes'],
    // No tiene campo `name`: usamos el nombre del producto poblado.
    resolveEntityName: (entity) => entity.product?.name || entity.description || entity.id,
};

// Líneas de detalle de las Solicitudes de Compra (ERS v0.8, cap. 6.8).
// Módulo hermano de purchase-requests, mismo patrón que
// suppliers/supplier-contacts: colección propia, referenciada por
// purchaseRequest, consultable por GET /purchase-request-details?purchaseRequest=<id>.
// Solo se puede crear/editar/borrar mientras la solicitud padre está en
// draft (validado en cada use-case).
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'purchase_request_details.view',
        description: 'Listar líneas de solicitud de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'purchase_request_details.view',
        description: 'Obtener una línea de solicitud de compra',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios de la línea de solicitud',
        handler: createEntityHistoryHandler(PurchaseRequestDetailModel.modelName, 'id'),
        middlewares: [requireOwnCompanyPurchaseRequestDetail]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'purchase_request_details.create',
        description: 'Crear línea de solicitud de compra',
        handler: controller.create,
        middlewares: [logAction({ ...purchaseRequestDetailAudit, action: 'create', resource: 'purchase_request_details', responseKey: 'newPurchaseRequestDetail' })]
    },
    {
        method: 'PUT',
        path: '/:id',
        permission: 'purchase_request_details.update',
        description: 'Actualizar línea de solicitud de compra',
        handler: controller.update,
        middlewares: [logAction({ ...purchaseRequestDetailAudit, action: 'update', resource: 'purchase_request_details', responseKey: 'purchaseRequestDetail' })]
    },
    {
        method: 'DELETE',
        path: '/:id',
        permission: 'purchase_request_details.delete',
        description: 'Eliminar línea de solicitud de compra',
        handler: controller.delete,
        middlewares: [logAction({ ...purchaseRequestDetailAudit, action: 'delete', resource: 'purchase_request_details' })]
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

export const purchaseRequestDetailRoutes = routes;
export default router;
