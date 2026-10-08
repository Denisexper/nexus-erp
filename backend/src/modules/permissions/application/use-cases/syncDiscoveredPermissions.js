import { discoverPermissions, groupPermissionsByResource } from '#shared/lib/permissionDiscovery.js';
import { Permission } from '../../domain/Permission.js';

/**
 * Sincroniza en la base de datos los permisos declarados en la metadata de
 * las rutas de todos los módulos (auto-discovery). Se ejecuta en cada arranque
 * del servidor para que el catálogo de permisos nunca quede desactualizado.
 * Devuelve los códigos descubiertos para que otros procesos de seed (ej. el
 * rol admin) puedan usarlos sin tener que descubrirlos de nuevo.
 */
export class SyncDiscoveredPermissionsUseCase {
  constructor(permissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(routeModules) {
    console.log('🔍 Descubriendo permisos de las rutas...');

    const discovered = discoverPermissions(routeModules);
    console.log(`✅ Descubiertos ${discovered.length} permisos únicos`);

    for (const perm of discovered) {
      await this.permissionRepository.upsertByCode(new Permission(perm));
    }

    // Un permiso cuya ruta ya no existe (ej. se quitó un endpoint) no debe
    // seguir apareciendo como asignable en el catálogo/UI de roles.
    await this.permissionRepository.deactivateMissing(discovered.map((perm) => perm.code));

    console.log('✅ Permisos sincronizados en base de datos');
    console.log('📊 Permisos por recurso:', Object.fromEntries(
      Object.entries(groupPermissionsByResource(discovered)).map(([resource, perms]) => [resource, perms.length])
    ));

    return discovered.map((perm) => perm.code);
  }
}
