import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { uploadPurchaseQuotationDocument as uploadMiddleware } from '#shared/lib/upload.js';
import { MongoPurchaseQuotationRepository } from '#modules/purchase-quotations/infrastructure/persistence/MongoPurchaseQuotationRepository.js';

import { PurchaseQuotationDocumentModel } from '../persistence/purchaseQuotationDocumentMongooseModel.js';
import { MongoPurchaseQuotationDocumentRepository } from '../persistence/MongoPurchaseQuotationDocumentRepository.js';
import { UploadPurchaseQuotationDocumentUseCase } from '../../application/use-cases/uploadPurchaseQuotationDocument.js';
import { ListPurchaseQuotationDocumentsUseCase } from '../../application/use-cases/listPurchaseQuotationDocuments.js';
import { DeletePurchaseQuotationDocumentUseCase } from '../../application/use-cases/deletePurchaseQuotationDocument.js';
import { PurchaseQuotationDocumentController } from './purchaseQuotationDocument.controller.js';

// --- Composition root ---
const purchaseQuotationDocumentRepository = new MongoPurchaseQuotationDocumentRepository();
const purchaseQuotationRepository = new MongoPurchaseQuotationRepository();

const controller = new PurchaseQuotationDocumentController({
    uploadPurchaseQuotationDocument: new UploadPurchaseQuotationDocumentUseCase(purchaseQuotationDocumentRepository, purchaseQuotationRepository),
    listPurchaseQuotationDocuments: new ListPurchaseQuotationDocumentsUseCase(purchaseQuotationDocumentRepository, purchaseQuotationRepository),
    deletePurchaseQuotationDocument: new DeletePurchaseQuotationDocumentUseCase(purchaseQuotationDocumentRepository, purchaseQuotationRepository),
});

const router = Router();

// PurchaseQuotationDocument no tiene campo `name`: usamos el nombre
// original del archivo, igual criterio que purchase-order-expense-documents.
const documentAudit = {
    entityModel: PurchaseQuotationDocumentModel,
    snapshot: { fields: ['purchaseQuotation', 'fileName', 'filePath', 'fileType'] },
    resolveEntityName: (entity) => entity.fileName || 'Documento de cotización',
};

// Módulo de Documentos de Cotización de Compra (plus-feature de Denis, no
// está en la ERS — ver docs/features/README.md): respaldo documental de la
// cotización (el PDF/foto que el proveedor devuelve cotizado). Relación 1:N
// real con PurchaseQuotation (varios adjuntos por cotización, ej. PDF +
// foto). Sin update: es un adjunto inmutable, solo se sube o se borra.
// multer corre antes que logAction porque necesita parsear el multipart
// antes de que cualquier otro middleware lea req.body/req.file (mismo
// criterio que product-images y purchase-order-expense-documents).
const routes = [
    {
        method: 'GET',
        path: '/quotation/:quotationId',
        permission: 'purchase_quotation_documents.view',
        description: 'Listar documentos adjuntos de una cotización de compra',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/quotation/:quotationId',
        permission: 'purchase_quotation_documents.upload',
        description: 'Subir documento adjunto a una cotización de compra',
        handler: controller.upload,
        middlewares: [uploadMiddleware.single('document'), logAction({ ...documentAudit, action: 'create', resource: 'purchase_quotation_documents', responseKey: 'newDocument' })]
    },
    {
        method: 'DELETE',
        path: '/:id',
        permission: 'purchase_quotation_documents.delete',
        description: 'Eliminar documento adjunto de una cotización de compra',
        handler: controller.delete,
        middlewares: [logAction({ ...documentAudit, action: 'delete', resource: 'purchase_quotation_documents' })]
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

export const purchaseQuotationDocumentRoutes = routes;
export default router;
