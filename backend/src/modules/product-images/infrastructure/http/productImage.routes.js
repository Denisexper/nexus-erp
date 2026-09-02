import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { uploadProductImage as uploadMiddleware } from '#shared/lib/upload.js';
import { MongoProductRepository } from '#modules/products/infrastructure/persistence/MongoProductRepository.js';

import { ProductImageModel } from '../persistence/productImageMongooseModel.js';
import { MongoProductImageRepository } from '../persistence/MongoProductImageRepository.js';
import { UploadProductImageUseCase } from '../../application/use-cases/uploadProductImage.js';
import { ListProductImagesUseCase } from '../../application/use-cases/listProductImages.js';
import { ListProductImageCoversUseCase } from '../../application/use-cases/listProductImageCovers.js';
import { ActivateProductImageUseCase } from '../../application/use-cases/activateProductImage.js';
import { DeactivateProductImageUseCase } from '../../application/use-cases/deactivateProductImage.js';
import { ProductImageController } from './productImage.controller.js';

// --- Composition root ---
const productImageRepository = new MongoProductImageRepository();
const productRepository = new MongoProductRepository();

const controller = new ProductImageController({
    uploadProductImage: new UploadProductImageUseCase(productImageRepository, productRepository),
    listProductImages: new ListProductImagesUseCase(productImageRepository, productRepository),
    activateProductImage: new ActivateProductImageUseCase(productImageRepository, productRepository),
    deactivateProductImage: new DeactivateProductImageUseCase(productImageRepository, productRepository),
    listProductImageCovers: new ListProductImageCoversUseCase(productImageRepository, productRepository),
});

const router = Router();

// ProductImage no tiene campo `name` propio: su identidad human-readable
// para la bitácora es el nombre del producto al que pertenece.
const resolveProductImageName = async (entity) => {
    const product = await productRepository.findById(entity.productId);
    return product ? `Imagen de ${product.name}` : 'Imagen de producto';
};

const productImageAudit = {
    entityModel: ProductImageModel,
    snapshot: { fields: ['productId', 'path', 'isActive'] },
    compareFields: ['isActive'],
    resolveEntityName: resolveProductImageName
};

// Módulo de Imágenes de Producto, ERS v0.7 cap. 6.7.5/6.7.16 (RN-PRO-016/017/018).
// Sin ruta de "update": el único campo mutable es isActive, ya cubierto por
// activate/deactivate. Sin borrado físico, mismo criterio soft-delete que el
// resto del ERS (RN-PRO-012). multer corre antes que logAction porque
// necesita parsear el multipart antes de que cualquier otro middleware lea
// req.body/req.file.
const routes = [
    {
        method: 'GET',
        path: '/product/:productId',
        permission: 'product_images.view',
        description: 'Listar imágenes de un producto',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/covers',
        permission: 'product_images.view',
        description: 'Obtener portadas (thumbnail) de varios productos',
        handler: controller.getCovers,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/product/:productId',
        permission: 'product_images.create',
        description: 'Cargar imagen de producto',
        handler: controller.upload,
        middlewares: [uploadMiddleware.single('image'), logAction({ ...productImageAudit, action: 'create', resource: 'product_images', responseKey: 'newProductImage' })]
    },
    {
        method: 'PATCH',
        path: '/:id/activate',
        permission: 'product_images.activate',
        description: 'Activar imagen de producto',
        handler: controller.activate,
        middlewares: [logAction({ ...productImageAudit, action: 'update', resource: 'product_images', responseKey: 'productImage' })]
    },
    {
        method: 'PATCH',
        path: '/:id/deactivate',
        permission: 'product_images.deactivate',
        description: 'Desactivar imagen de producto',
        handler: controller.deactivate,
        middlewares: [logAction({ ...productImageAudit, action: 'update', resource: 'product_images', responseKey: 'productImage' })]
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

export const productImageRoutes = routes;
export default router;
