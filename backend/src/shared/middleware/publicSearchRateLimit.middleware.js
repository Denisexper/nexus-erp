import rateLimit from 'express-rate-limit';

/**
 * Rate limit para los endpoints públicos de resolución de tenant (búsqueda
 * de empresa por nombre/slug, sin autenticación). Más estricto que el
 * global: existen específicamente para frenar scraping/enumeración del
 * listado de empresas, no solo abuso genérico.
 */
export const publicSearchRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msj: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});
