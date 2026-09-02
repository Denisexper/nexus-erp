import { RoleModel } from '../persistence/roleMongooseModel.js';
import { PermissionModel } from '#modules/permissions/infrastructure/persistence/permissionMongooseModel.js';
import { CompanyModel } from '#modules/companies/infrastructure/persistence/companyMongooseModel.js';

// Permisos que no corresponden a ninguna ruta protegida (no hay módulo de
// dashboard todavía) y por eso el auto-discovery nunca los va a encontrar.
// Se mantienen a mano y se agregan al admin además de los descubiertos.
export const PERMISSIONS = {
    USERS_READ: 'users.read',
    USERS_CREATE: 'users.create',
    USERS_UPDATE: 'users.update',
    LOGS_READ: 'logs.read',
    DASHBOARD_VIEW: 'dashboard.view',
    DASHBOARD_STATS: 'dashboard.stats'
};

/**
 * Sincroniza los roles base (admin/moderator/user) de UNA empresa.
 *
 * - admin: siempre se reescribe con TODOS los permisos activos del catálogo
 *   (más los que no corresponden a ninguna ruta, como dashboard.*), así
 *   nunca queda desactualizado cuando se agregan módulos.
 * - moderator / user: solo se crean si todavía no existen para esa empresa.
 *   Si ya existen no se tocan, para no pisar permisos que un admin les haya
 *   asignado a mano desde la UI de roles.
 *
 * Los códigos de permiso se leen directo del catálogo (PermissionModel) en
 * vez de recibirlos por parámetro: así esta función sirve tanto para el
 * seed masivo al boot (después de SyncDiscoveredPermissionsUseCase) como
 * para sembrar una empresa nueva creada en caliente, sin que quien la llama
 * tenga que rearmar la lista de permisos descubiertos.
 *
 * @param {string} companyId
 */
export const seedRolesForCompany = async (companyId) => {
    const discoveredPermissionCodes = (await PermissionModel.find({ isActive: true }).select('code'))
        .map((doc) => doc.code);

    const adminPermissions = Array.from(new Set([
        ...discoveredPermissionCodes,
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_STATS,
    ]));

    await RoleModel.findOneAndUpdate(
        { company: companyId, name: 'admin' },
        {
            company: companyId,
            name: 'admin',
            displayName: 'Administrador',
            description: 'Control total del sistema',
            permissions: adminPermissions,
            isSystem: true,
        },
        { upsert: true }
    );

    const defaultRoles = [
        {
            name: 'moderator',
            displayName: 'Moderador',
            description: 'Puede gestionar usuarios y ver logs',
            permissions: [
                PERMISSIONS.USERS_READ,
                PERMISSIONS.USERS_CREATE,
                PERMISSIONS.USERS_UPDATE,
                PERMISSIONS.LOGS_READ,
                PERMISSIONS.DASHBOARD_VIEW
            ],
            isSystem: true
        },
        {
            name: 'user',
            displayName: 'Usuario',
            description: 'Usuario estándar sin permisos especiales',
            permissions: [PERMISSIONS.DASHBOARD_VIEW],
            isSystem: true
        }
    ];

    for (const roleData of defaultRoles) {
        const exists = await RoleModel.exists({ company: companyId, name: roleData.name });
        if (!exists) {
            await RoleModel.create({ ...roleData, company: companyId });
        }
    }
};

/**
 * Corre seedRolesForCompany para cada empresa activa. Se ejecuta en cada
 * arranque del servidor, después de sincronizar el catálogo de permisos
 * (ver server.js), para que ninguna empresa se quede con roles desactualizados
 * cuando se agregan módulos/permisos nuevos.
 */
export const seedRolesForAllCompanies = async () => {
    try {
        console.log('🌱 Sincronizando roles del sistema por empresa...');

        const companies = await CompanyModel.find({ isActive: true }).select('_id');
        for (const company of companies) {
            await seedRolesForCompany(company._id);
        }

        console.log(`🎉 Sincronización de roles completada para ${companies.length} empresa(s)`);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        throw error;
    }
};
