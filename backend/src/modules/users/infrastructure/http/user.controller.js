import {
  InvalidUserIdError,
  UserNotFoundError,
  DuplicateEmailError,
  InvalidRoleError,
  WeakPasswordError,
  ForbiddenRoleChangeError,
  ForbiddenUserDeletionError,
  CannotDeleteSelfError,
} from '../../domain/errors.js';

// Traduce la entidad de dominio (que usa `id`, y `role` puede venir como un
// subdocumento poblado o como un id crudo) a la forma que ya consume el
// frontend. Nunca incluye el hash de la contraseña.
const toUserDTO = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role?.name || user.role,
  roleId: user.role?._id || user.role,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  lockedUntil: user.lockedUntil,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserController {
  constructor({ listUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, unlockUser }) {
    this.listUsersUseCase = listUsers;
    this.getUserByIdUseCase = getUserById;
    this.createUserUseCase = createUser;
    this.updateUserUseCase = updateUser;
    this.deleteUserUseCase = deleteUser;
    this.toggleUserStatusUseCase = toggleUserStatus;
    this.unlockUserUseCase = unlockUser;
  }

  // Único lugar del módulo que traduce errores de dominio a códigos HTTP.
  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidUserIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof UserNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateEmailError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidRoleError) return res.status(400).json({ msj: error.message });
    if (error instanceof WeakPasswordError) return res.status(400).json({ msj: error.message });
    if (error instanceof ForbiddenRoleChangeError) return res.status(403).json({ msj: error.message });
    if (error instanceof ForbiddenUserDeletionError) return res.status(403).json({ msj: error.message });
    if (error instanceof CannotDeleteSelfError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, role, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listUsersUseCase.execute({ search, role, isActive, page, limit });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de usuarios vacia' : 'usuarios obtenidos correctamente',
        total: result.total,
        data: result.items.map(toUserDTO),
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
      this.#handleError(res, error, 'error del servidor');
    }
  };

  getOne = async (req, res) => {
    try {
      const user = await this.getUserByIdUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'user encontrado', data: toUserDTO(user) });
    } catch (error) {
      this.#handleError(res, error, 'error del servidor');
    }
  };

  create = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const { user, role: roleDoc } = await this.createUserUseCase.execute({
        name,
        email,
        password,
        role,
        companyId: req.user.companyId,
      });

      res.status(201).json({
        msj: 'user creado exitosamente',
        newUser: { ...toUserDTO(user), role: roleDoc.name, roleId: roleDoc.id },
      });
    } catch (error) {
      this.#handleError(res, error, 'error de servidor');
    }
  };

  update = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const user = await this.updateUserUseCase.execute(
        req.params.id,
        { name, email, password, role },
        { actingUserRole: req.user.role },
      );
      res.status(200).json({ msj: 'usuario actualizado correctamente', user: toUserDTO(user) });
    } catch (error) {
      this.#handleError(res, error, 'error actualizando usuario');
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.deleteUserUseCase.execute(req.params.id, {
        actingUserId: req.user.id,
        actingUserRole: req.user.role,
      });
      res.status(200).json({ msj: 'usuario eliminado correctamente', deleteUser: toUserDTO(deleted) });
    } catch (error) {
      this.#handleError(res, error, 'error eliminando usuario');
    }
  };

  toggleUserStatus = async (req, res) => {
    try {
      const user = await this.toggleUserStatusUseCase.execute(req.params.id);
      res.status(200).json({
        msj: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`,
        user: toUserDTO(user),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error al cambiar estado del usuario');
    }
  };

  unlockUser = async (req, res) => {
    try {
      const user = await this.unlockUserUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Usuario desbloqueado correctamente', user: toUserDTO(user) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desbloquear usuario');
    }
  };
}
