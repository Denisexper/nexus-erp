import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { loginRateLimiter } from '#shared/middleware/loginRateLimit.middleware.js';

import { MongoUserRepository } from '#modules/users/infrastructure/persistence/MongoUserRepository.js';
import { MongoRoleRepository } from '#modules/roles/infrastructure/persistence/MongoRoleRepository.js';
import { MongoCompanyRepository } from '#modules/companies/infrastructure/persistence/MongoCompanyRepository.js';
import { MongoLogRepository } from '#modules/logs/infrastructure/persistence/MongoLogRepository.js';
import { CreateUserUseCase } from '#modules/users/application/use-cases/createUser.js';
import { GetUserByIdUseCase } from '#modules/users/application/use-cases/getUserById.js';
import { WriteLogEntryUseCase } from '#modules/logs/application/use-cases/writeLogEntry.js';

import { RegisterUserUseCase } from '../../application/use-cases/registerUser.js';
import { LoginUseCase } from '../../application/use-cases/login.js';
import { LogoutUseCase } from '../../application/use-cases/logout.js';
import { AuthController } from './auth.controller.js';

// --- Composition root: aquí, y solo aquí, se conectan las piezas concretas ---
const userRepository = new MongoUserRepository();
const roleRepository = new MongoRoleRepository();
const companyRepository = new MongoCompanyRepository();
const logRepository = new MongoLogRepository();

const createUserUseCase = new CreateUserUseCase(userRepository, roleRepository);
const writeLogEntryUseCase = new WriteLogEntryUseCase(logRepository);

const controller = new AuthController({
    registerUser: new RegisterUserUseCase(createUserUseCase),
    login: new LoginUseCase(userRepository, companyRepository, writeLogEntryUseCase),
    logout: new LogoutUseCase(writeLogEntryUseCase),
    getUserById: new GetUserByIdUseCase(userRepository),
});

const router = Router();

// rutas publicas
router.post('/login', loginRateLimiter, controller.login);

// logout solo necesita estar logeado
router.post('/logout', authMiddleware, controller.logout);

// datos del usuario actual
router.get('/me', authMiddleware, controller.me);

export default router;
