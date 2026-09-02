import {
  InvalidRoleIdError,
  RoleNotFoundError,
  DuplicateRoleNameError,
  SystemRoleNameImmutableError,
  SystemRoleImmutableError,
  RoleInUseError,
} from '../../domain/errors.js';

const toRoleDTO = (role) => ({
  _id: role.id,
  id: role.id,
  name: role.name,
  displayName: role.displayName,
  description: role.description,
  permissions: role.permissions,
  isSystem: role.isSystem,
  isActive: role.isActive,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

export class RoleController {
  constructor({ listRoles, getRoleById, createRole, updateRole, deleteRole }) {
    this.listRolesUseCase = listRoles;
    this.getRoleByIdUseCase = getRoleById;
    this.createRoleUseCase = createRole;
    this.updateRoleUseCase = updateRole;
    this.deleteRoleUseCase = deleteRole;
  }

  // Único lugar del módulo que traduce errores de dominio a códigos HTTP.
  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidRoleIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof RoleNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateRoleNameError) return res.status(400).json({ msj: error.message });
    if (error instanceof SystemRoleNameImmutableError) return res.status(400).json({ msj: error.message });
    if (error instanceof SystemRoleImmutableError) return res.status(400).json({ msj: error.message });
    if (error instanceof RoleInUseError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.listRolesUseCase.execute({ company: req.user.companyId, page, limit });

      res.status(200).json({
        msj: 'Roles obtenidos correctamente',
        total: result.total,
        data: result.items.map(toRoleDTO),
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalRecords: result.total,
          limit: result.limit,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo roles');
    }
  };

  getOne = async (req, res) => {
    try {
      const role = await this.getRoleByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Rol encontrado', data: toRoleDTO(role) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo rol');
    }
  };

  create = async (req, res) => {
    try {
      const { name, displayName, description, permissions } = req.body;
      const role = await this.createRoleUseCase.execute({
        company: req.user.companyId,
        name,
        displayName,
        description,
        permissions: permissions || [],
      });
      res.status(201).json({ msj: 'Rol creado exitosamente', data: toRoleDTO(role) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando rol');
    }
  };

  update = async (req, res) => {
    try {
      const { name, displayName, description, permissions, isActive } = req.body;
      const role = await this.updateRoleUseCase.execute(req.params.id, {
        name,
        displayName,
        description,
        permissions,
        isActive,
      }, req.user.companyId);
      res.status(200).json({ msj: 'Rol actualizado correctamente', data: toRoleDTO(role) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando rol');
    }
  };

  delete = async (req, res) => {
    try {
      await this.deleteRoleUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Rol eliminado correctamente' });
    } catch (error) {
      this.#handleError(res, error, 'Error eliminando rol');
    }
  };
}
