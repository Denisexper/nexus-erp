import { InvalidCredentialsError, UserInactiveError, UserLockedError } from '../../domain/errors.js';
import { DuplicateEmailError, InvalidRoleError, WeakPasswordError } from '#modules/users/domain/errors.js';

const toAuthUserDTO = (user, roleDoc) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  companyId: user.company?._id || user.company,
  role: roleDoc?.name || user.role?.name || user.role,
  roleId: roleDoc?.id || user.role?._id || user.role,
  permissions: roleDoc?.permissions || user.role?.permissions,
});

export class AuthController {
  constructor({ registerUser, login, logout, getUserById }) {
    this.registerUserUseCase = registerUser;
    this.loginUseCase = login;
    this.logoutUseCase = logout;
    this.getUserByIdUseCase = getUserById;
  }

  // Único lugar del módulo que traduce errores de dominio a códigos HTTP.
  // También reconoce los errores del módulo users, porque register delega
  // en su CreateUserUseCase.
  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidCredentialsError) return res.status(401).json({ msj: error.message });
    if (error instanceof UserInactiveError) return res.status(403).json({ msj: error.message });
    if (error instanceof UserLockedError) {
      res.set('Retry-After', String(error.retryAfterSeconds));
      return res.status(403).json({ msj: error.message });
    }
    if (error instanceof DuplicateEmailError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidRoleError) return res.status(400).json({ msj: error.message });
    if (error instanceof WeakPasswordError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  register = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const { token, user, role: roleDoc } = await this.registerUserUseCase.execute({ name, email, password, role });

      res.status(201).json({
        msj: 'usuario registrado exitosamente',
        token,
        newUser: toAuthUserDTO(user, roleDoc),
      });
    } catch (error) {
      this.#handleError(res, error, 'error al registrar el usuario');
    }
  };

  login = async (req, res) => {
    try {
      const { slug, email, password } = req.body;
      const { token, user } = await this.loginUseCase.execute(
        { slug, email, password },
        { ipAddress: req.ip, userAgent: req.get('user-agent') },
      );

      res.status(200).json({
        msj: 'Login exitoso',
        token,
        user: toAuthUserDTO(user),
      });
    } catch (error) {
      this.#handleError(res, error, 'error en el login');
    }
  };

  logout = async (req, res) => {
    try {
      await this.logoutUseCase.execute({
        userId: req.user.id,
        userName: req.user.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(200).json({ msj: 'Logout exitoso' });
    } catch (error) {
      this.#handleError(res, error, 'error en el logout');
    }
  };

  me = async (req, res) => {
    try {
      const user = await this.getUserByIdUseCase.execute(req.user.id);
      res.status(200).json({
        msj: 'perfil obtenido',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.company?._id || user.company,
          role: user.role?.name,
          roleId: user.role?._id,
          permissions: user.role?.permissions,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'error del servidor');
    }
  };
}
