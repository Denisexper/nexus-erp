import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoPurchaseOrderRepository } from '#modules/purchase-orders/infrastructure/persistence/MongoPurchaseOrderRepository.js';

import { RetaceoModel } from '../persistence/retaceoMongooseModel.js';
import { MongoRetaceoRepository } from '../persistence/MongoRetaceoRepository.js';
import { ListRetaceosUseCase } from '../../application/use-cases/listRetaceos.js';
import { GetRetaceoByIdUseCase } from '../../application/use-cases/getRetaceoById.js';
import { CreateRetaceoUseCase } from '../../application/use-cases/createRetaceo.js';
import { RetaceoController } from './retaceo.controller.js';

// --- Composition root ---
const retaceoRepository = new MongoRetaceoRepository();
const purchaseOrderRepository = new MongoPurchaseOrderRepository();

const controller = new RetaceoController({
    listRetaceos: new ListRetaceosUseCase(retaceoRepository),
    getRetaceoById: new GetRetaceoByIdUseCase(retaceoRepository),
    createRetaceo: new CreateRetaceoUseCase(retaceoRepository, purchaseOrderRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá, igual que en
// purchase-orders/purchaseOrder.routes.js.
const requireOwnCompanyRetaceo = async (req, res, next) => {
    try {
        const doc = await RetaceoModel.findOne({ _id: req.params.id, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Retaceo no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

const retaceoAudit = {
    entityModel: RetaceoModel,
    snapshot: {
        fields: ['company', 'code', 'purchaseOrder', 'supplier', 'retaceoDate', 'originCountry', 'importInvoiceNumber', 'importInvoiceDate', 'importPolicyNumber', 'importPolicyDate', 'totalFob', 'totalFreight', 'totalExpenses', 'totalDai', 'totalCost', 'status', 'notes'],
        populate: 'supplier',
    },
    compareFields: ['status', 'notes'],
    // Retaceo no tiene campo `name`: usamos el código visible (RTC-00001).
    resolveEntityName: (entity) => entity.code,
};

// Módulo de Retaceo (distribución de gastos de importación, RN-011/RN-012 del
// ERS) — etapa "posterior" del capítulo 6.8, ahora habilitada. Se registra
// completo en un solo POST a partir de una orden de compra 'approved': toma
// el FOB y los gastos ya registrados de la orden, y agrega flete/DAI como
// datos capturados en este mismo paso (solo se conocen al despacho aduanal).
// Es inmutable una vez creado: no hay PUT, la única forma de corregirlo es
// registrar uno nuevo después de resolver el dato incorrecto en la orden de
// origen (no existe todavía un endpoint de cancelación).
const routes = [
    {
        method: 'GET',
        path: '/',
        permission: 'retaceos.view',
        description: 'Listar retaceos',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id',
        permission: 'retaceos.view',
        description: 'Obtener un retaceo',
        handler: controller.getOne,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/:id/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del retaceo',
        handler: createEntityHistoryHandler(RetaceoModel.modelName, 'id'),
        middlewares: [requireOwnCompanyRetaceo]
    },
    {
        method: 'POST',
        path: '/',
        permission: 'retaceos.create',
        description: 'Registrar retaceo',
        handler: controller.create,
        middlewares: [logAction({ ...retaceoAudit, action: 'create', resource: 'retaceos', responseKey: 'newRetaceo' })]
    },
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

export const retaceoRoutes = routes;
export default router;
