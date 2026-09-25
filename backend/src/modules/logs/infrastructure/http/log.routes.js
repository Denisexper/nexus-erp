import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { devOnlyMiddleware } from '#shared/middleware/devOnly.middleware.js';

import { MongoLogRepository } from '../persistence/MongoLogRepository.js';
import { ListLogsUseCase } from '../../application/use-cases/listLogs.js';
import { ListLogsForExportUseCase } from '../../application/use-cases/listLogsForExport.js';
import { DeleteAllLogsUseCase } from '../../application/use-cases/deleteAllLogs.js';
import { LogController } from './log.controller.js';

// --- Composition root: aquí, y solo aquí, se conectan las piezas concretas ---
// (Mongo) con las abstractas (casos de uso, controller).
const logRepository = new MongoLogRepository();

const controller = new LogController({
    listLogs: new ListLogsUseCase(logRepository),
    listLogsForExport: new ListLogsForExportUseCase(logRepository),
    deleteAllLogs: new DeleteAllLogsUseCase(logRepository),
});

const router = Router();

// rutas con metadata
const routes = [
    // primero los permisos especificos
    {
        method: 'GET',
        path: '/logs/reports/excel',
        permission: 'logs.export',
        description: 'Generar reportes(PDF/Excel)',
        handler: controller.exportExcel,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/logs/reports/pdf',
        permission: 'logs.export',
        description: 'Exportar logs a PDF',
        handler: controller.exportPdf,
        middlewares: []
    },
    {
        method: 'GET',
        path: '/logs',
        permission: 'logs.read',
        description: 'Listar logs del sistema',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'DELETE',
        path: '/logs/dev/purge',
        permission: 'logs.deleteall',
        description: 'Eliminar todos los logs (solo desarrollo)',
        handler: controller.deleteAll,
        middlewares: [devOnlyMiddleware]
    },
];

// registrar rutas automáticamente
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

// exportar metadata para auto-discovery
export const logRoutes = routes;

// exportar router para usar en server.js
export default router;
