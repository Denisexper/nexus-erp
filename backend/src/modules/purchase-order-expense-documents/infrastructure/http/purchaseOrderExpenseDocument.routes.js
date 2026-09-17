import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { uploadPurchaseOrderExpenseDocument as uploadMiddleware } from '#shared/lib/upload.js';
import { MongoPurchaseOrderRepository } from '#modules/purchase-orders/infrastructure/persistence/MongoPurchaseOrderRepository.js';

import { PurchaseOrderExpenseDocumentModel } from '../persistence/purchaseOrderExpenseDocumentMongooseModel.js';
import { MongoPurchaseOrderExpenseDocumentRepository } from '../persistence/MongoPurchaseOrderExpenseDocumentRepository.js';
import { UploadPurchaseOrderExpenseDocumentUseCase } from '../../application/use-cases/uploadPurchaseOrderExpenseDocument.js';
import { ListPurchaseOrderExpenseDocumentsUseCase } from '../../application/use-cases/listPurchaseOrderExpenseDocuments.js';
import { DeletePurchaseOrderExpenseDocumentUseCase } from '../../application/use-cases/deletePurchaseOrderExpenseDocument.js';
import { PurchaseOrderExpenseDocumentController } from './purchaseOrderExpenseDocument.controller.js';

// --- Composition root ---
const purchaseOrderExpenseDocumentRepository = new MongoPurchaseOrderExpenseDocumentRepository();
const purchaseOrderRepository = new MongoPurchaseOrderRepository();

const controller = new PurchaseOrderExpenseDocumentController({
    uploadPurchaseOrderExpenseDocument: new UploadPurchaseOrderExpenseDocumentUseCase(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository),
    listPurchaseOrderExpenseDocuments: new ListPurchaseOrderExpenseDocumentsUseCase(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository),
    deletePurchaseOrderExpenseDocument: new DeletePurchaseOrderExpenseDocumentUseCase(purchaseOrderExpenseDocumentRepository, purchaseOrderRepository),
});

const router = Router();

// PurchaseOrderExpenseDocument no tiene campo `name`: usamos el nombre
// original del archivo, igual criterio que product-images con el nombre del
// producto.
const documentAudit = {
    entityModel: PurchaseOrderExpenseDocumentModel,
    snapshot: { fields: ['purchaseOrderExpense', 'fileName', 'filePath', 'fileType'] },
    resolveEntityName: (entity) => entity.fileName || 'Documento de gasto',
};

// Módulo de Evidencias de Gastos de Orden de Compra (ERS v0.9, cap. 6.8.20).
// Sin update: es un adjunto inmutable, solo se sube o se borra. multer corre
// antes que logAction porque necesita parsear el multipart antes de que
// cualquier otro middleware lea req.body/req.file (mismo criterio que
// product-images).
const routes = [
    {
        method: 'GET',
        path: '/expense/:expenseId',
        permission: 'purchase_order_expense_documents.view',
        description: 'Listar documentos de un gasto de orden de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/expense/:expenseId',
        permission: 'purchase_order_expense_documents.upload',
        description: 'Subir documento de evidencia de un gasto',
        handler: controller.upload,
        middlewares: [uploadMiddleware.single('document'), logAction({ ...documentAudit, action: 'create', resource: 'purchase_order_expense_documents', responseKey: 'newDocument' })]
    },
    {
        method: 'DELETE',
        path: '/:id',
        permission: 'purchase_order_expense_documents.delete',
        description: 'Eliminar documento de evidencia de un gasto',
        handler: controller.delete,
        middlewares: [logAction({ ...documentAudit, action: 'delete', resource: 'purchase_order_expense_documents' })]
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

export const purchaseOrderExpenseDocumentRoutes = routes;
export default router;
