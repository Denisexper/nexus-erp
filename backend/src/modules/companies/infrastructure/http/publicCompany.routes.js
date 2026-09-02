import { Router } from 'express';
import { publicSearchRateLimiter } from '#shared/middleware/publicSearchRateLimit.middleware.js';

import { MongoCompanyRepository } from '../persistence/MongoCompanyRepository.js';
import { SearchPublicCompaniesUseCase } from '../../application/use-cases/searchPublicCompanies.js';
import { GetPublicCompanyBySlugUseCase } from '../../application/use-cases/getPublicCompanyBySlug.js';
import { PublicCompanyController } from './publicCompany.controller.js';

// --- Composition root ---
// Rutas públicas (sin authMiddleware): resuelven qué empresa es cada tenant
// antes de que exista una sesión. No participan del auto-discovery de
// permisos (no hay permiso que exigir en un endpoint sin auth).
const companyRepository = new MongoCompanyRepository();

const controller = new PublicCompanyController({
    searchPublicCompanies: new SearchPublicCompaniesUseCase(companyRepository),
    getPublicCompanyBySlug: new GetPublicCompanyBySlugUseCase(companyRepository),
});

const router = Router();

router.get('/', publicSearchRateLimiter, controller.search);
router.get('/:slug', publicSearchRateLimiter, controller.getBySlug);

export default router;
