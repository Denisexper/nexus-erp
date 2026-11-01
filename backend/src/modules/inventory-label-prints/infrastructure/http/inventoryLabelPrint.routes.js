import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { MongoInventoryRepository } from '#modules/inventory/infrastructure/persistence/MongoInventoryRepository.js';

import { InventoryLabelPrintModel } from '../persistence/inventoryLabelPrintMongooseModel.js';
import { MongoInventoryLabelPrintRepository } from '../persistence/MongoInventoryLabelPrintRepository.js';
import { PrintInventoryLabelUseCase } from '../../application/use-cases/printLabel.js';
import { ListInventoryLabelPrintsUseCase } from '../../application/use-cases/listLabelPrints.js';
import { GetInventoryLabelPrintForPdfUseCase } from '../../application/use-cases/getLabelPrintForPdf.js';
import { InventoryLabelPrintController } from './inventoryLabelPrint.controller.js';

// --- Composition root ---
const inventoryLabelPrintRepository = new MongoInventoryLabelPrintRepository();
const inventoryRepository = new MongoInventoryRepository();

const controller = new InventoryLabelPrintController({
    printLabel: new PrintInventoryLabelUseCase(inventoryLabelPrintRepository, inventoryRepository),
    listLabelPrints: new ListInventoryLabelPrintsUseCase(inventoryLabelPrintRepository, inventoryRepository),
    getLabelPrintForPdf: new GetInventoryLabelPrintForPdfUseCase(inventoryLabelPrintRepository, inventoryRepository),
});

const router = Router();

const labelPrintAudit = {
    entityModel: InventoryLabelPrintModel,
    snapshot: { fields: ['inventoryLot', 'quantityPrinted', 'reprintReason'] },
    // InventoryLabelPrint no tiene campo `name`: usamos cantidad + si es reimpresión.
    resolveEntityName: (entity) => `${entity.reprintReason ? 'Reimpresión' : 'Impresión'} · ${entity.quantityPrinted} etiqueta(s)`,
};

// Módulo de Etiquetado de Inventario (ERS v1.0, cap. 6.9), Fase 2. Un solo
// endpoint cubre imprimir y reimprimir (RN-INV-016/017): es "reimpresión"
// automáticamente cuando el lote ya tiene impresiones previas, y ahí exige motivo.
const routes = [
    {
        method: 'GET',
        path: '/lot/:lotId',
        permission: 'inventory.label.print',
        description: 'Listar impresiones de etiqueta de un lote',
        handler: controller.getAllByLot,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/',
        permission: 'inventory.label.print',
        description: 'Imprimir o reimprimir etiqueta de un lote de inventario',
        handler: controller.print,
        middlewares: [logAction({ ...labelPrintAudit, action: 'create', resource: 'inventory_label_prints', responseKey: 'newLabelPrint' })]
    },
    {
        method: 'GET',
        path: '/:id/pdf',
        permission: 'inventory.label.print',
        description: 'Descargar la hoja de etiquetas en PDF de una impresión',
        handler: controller.downloadPdf,
        middlewares: []
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

export const inventoryLabelPrintRoutes = routes;
export default router;
