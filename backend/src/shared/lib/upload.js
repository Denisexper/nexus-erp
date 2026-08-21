import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const PRODUCTS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products');
fs.mkdirSync(PRODUCTS_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PRODUCTS_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${randomUUID()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Extensión de archivo no permitida'));
    }
    cb(null, true);
};

const multerInstance = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// El proyecto no tiene error-handling middleware de Express (4 args) en
// ningún lado: todos los errores se manejan dentro del try/catch de cada
// controller. Para mantener ese mismo patrón con multer (que normalmente
// reporta errores llamando next(err), saltándose el controller), envolvemos
// single() para que en vez de eso guarde el error en req.uploadError y el
// controller lo relance dentro de su propio try/catch.
export const uploadProductImage = {
    single: (fieldName) => (req, res, next) => {
        multerInstance.single(fieldName)(req, res, (err) => {
            if (err) req.uploadError = err;
            next();
        });
    },
};
