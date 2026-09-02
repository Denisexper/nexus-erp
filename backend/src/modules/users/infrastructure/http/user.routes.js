import { Router } from 'express';
import { authMiddleware } from '#shared/middleware/auth.middleware.js';
import { checkPermission } from '#shared/middleware/checkPermission.middleware.js';
import { logAction } from '#modules/logs/infrastructure/audit/logAction.middleware.js';
import { createEntityHistoryHandler } from '#modules/logs/infrastructure/audit/entityHistory.handler.js';
import { MongoRoleRepository } from '#modules/roles/infrastructure/persistence/MongoRoleRepository.js';

import { MongoUserRepository } from '../persistence/MongoUserRepository.js';
import { UserModel } from '../persistence/userMongooseModel.js';
import { ListUsersUseCase } from '../../application/use-cases/listUsers.js';
import { GetUserByIdUseCase } from '../../application/use-cases/getUserById.js';
import { CreateUserUseCase } from '../../application/use-cases/createUser.js';
import { UpdateUserUseCase } from '../../application/use-cases/updateUser.js';
import { ToggleUserStatusUseCase } from '../../application/use-cases/toggleUserStatus.js';
import { UnlockUserUseCase } from '../../application/use-cases/unlockUser.js';
import { UserController } from './user.controller.js';

// --- Composition root: aquí, y solo aquí, se conectan las piezas concretas ---
const userRepository = new MongoUserRepository();
const roleRepository = new MongoRoleRepository();

const controller = new UserController({
    listUsers: new ListUsersUseCase(userRepository),
    getUserById: new GetUserByIdUseCase(userRepository),
    createUser: new CreateUserUseCase(userRepository, roleRepository),
    updateUser: new UpdateUserUseCase(userRepository, roleRepository),
    toggleUserStatus: new ToggleUserStatusUseCase(userRepository),
    unlockUser: new UnlockUserUseCase(userRepository),
});

const router = Router();

// El handler de historial es genérico (compartido por todos los módulos) y no
// filtra por tenant, así que la ownership check se hace acá antes de llegar
// a él, igual que en companies.routes.js.
const requireSameTenantUser = async (req, res, next) => {
    try {
        const doc = await UserModel.findOne({ _id: req.params.userId, company: req.user.companyId }).select('_id');
        if (!doc) return res.status(404).json({ msj: 'Usuario no encontrado' });
        next();
    } catch (error) {
        res.status(400).json({ msj: 'Id no válido' });
    }
};

// Config de auditoría compartida por las rutas de usuarios
const userAudit = {
    entityModel: UserModel,
    snapshot: {
        fields: ['name', 'email', 'role', 'isActive', 'lastLogin'],
        populate: 'role',
        transform: (snapshot, doc) => ({
            ...snapshot,
            role: doc.role?.name || doc.role,
            roleId: doc.role?._id
        })
    },
    compareFields: ['name', 'email', 'role', 'isActive']
}

// rutas con metadata
const routes = [
    {
        method: 'GET',
        path: '/users',
        permission: 'users.read',
        description: 'Listar usuarios',
        handler: controller.getAll,
        middlewares: []
    },
    {
        method: 'POST',
        path: '/users',
        permission: 'users.create',
        description: 'Crear usuario',
        handler: controller.create,
        middlewares: [logAction({ ...userAudit, action: 'create', resource: 'users', responseKey: 'newUser' })]
    },
    {
        method: 'GET',
        path: '/users/:id',
        permission: 'users.read',
        description: 'Obtener un usuario',
        handler: controller.getOne,
        middlewares: [logAction({ ...userAudit, action: 'read', resource: 'users' })]
    },
    {
        method: 'PUT',
        path: '/users/:id',
        permission: 'users.update',
        description: 'Actualizar usuario',
        handler: controller.update,
        middlewares: [logAction({ ...userAudit, action: 'update', resource: 'users', responseKey: 'user' })]
    },
    {
        method: 'PATCH',
        path: '/users/:id/toggle-status',
        permission: 'users.update',
        description: 'Activar/Desactivar usuario',
        handler: controller.toggleUserStatus,
        middlewares: [logAction({ ...userAudit, action: 'update', resource: 'users', responseKey: 'user' })]
    },
    {
        method: 'PATCH',
        path: '/users/:id/unlock',
        permission: 'users.update',
        description: 'Desbloquear usuario (RN-005)',
        handler: controller.unlockUser,
        middlewares: [logAction({ ...userAudit, action: 'update', resource: 'users', responseKey: 'user' })]
    },
    {
        method: 'GET',
        path: '/users/:userId/history',
        permission: 'logs.read',
        description: 'Ver historial de cambios del usuario',
        handler: createEntityHistoryHandler(UserModel.modelName, 'userId'),
        middlewares: [requireSameTenantUser]
    }
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
export const userRoutes = routes;

// exportar router para usar en server.js
export default router;
