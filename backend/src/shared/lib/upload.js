import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// El proyecto no tiene error-handling middleware de Express (4 args) en
// ningún lado: todos los errores se manejan dentro del try/catch de cada
// controller. Para mantener ese mismo patrón con multer (que normalmente
// reporta errores llamando next(err), saltándose el controller), envolvemos
// single() para que en vez de eso guarde el error en req.uploadError y el
// controller lo relance dentro de su propio try/catch.
const buildSingleUploader = (uploadDir, allowedMimeTypes) => {
    const dir = path.join(process.cwd(), 'uploads', uploadDir);
    fs.mkdirSync(dir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dir),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${randomUUID()}${ext}`);
        },
    });

    const fileFilter = (_req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Extensión de archivo no permitida'));
        }
        cb(null, true);
    };

    const multerInstance = multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
    });

    return {
        single: (fieldName) => (req, res, next) => {
            multerInstance.single(fieldName)(req, res, (err) => {
                if (err) req.uploadError = err;
                next();
            });
        },
    };
};

export const uploadProductImage = buildSingleUploader('products', ['image/jpeg', 'image/png', 'image/webp']);

// ERS v0.9 cap. 6.8.20: evidencias documentales de gastos de orden de
// compra. A diferencia de las imágenes de producto, acá también se acepta
// PDF (facturas, pólizas, comprobantes).
export const uploadPurchaseOrderExpenseDocument = buildSingleUploader('purchase-order-expenses', [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]);
