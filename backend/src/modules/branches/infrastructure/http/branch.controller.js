import {
  InvalidBranchIdError,
  BranchNotFoundError,
  CompanyNotFoundForBranchError,
  DuplicateBranchNameError,
  InvalidLocationError,
} from '../../domain/errors.js';

const toBranchDTO = (branch) => ({
  _id: branch.id,
  id: branch.id,
  company: branch.company,
  name: branch.name,
  address: branch.address,
  department: branch.department,
  municipality: branch.municipality,
  district: branch.district,
  phone: branch.phone,
  email: branch.email,
  isActive: branch.isActive,
  createdAt: branch.createdAt,
  updatedAt: branch.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['company', 'name', 'address', 'department', 'municipality', 'district', 'phone', 'email'];
// `company` no es editable después de creada la sucursal (ver updateBranch.js).
const UPDATE_FIELDS = ['name', 'address', 'department', 'municipality', 'district', 'phone', 'email'];

export class BranchController {
  constructor({ listBranches, getBranchById, createBranch, updateBranch, activateBranch, deactivateBranch }) {
    this.listBranchesUseCase = listBranches;
    this.getBranchByIdUseCase = getBranchById;
    this.createBranchUseCase = createBranch;
    this.updateBranchUseCase = updateBranch;
    this.activateBranchUseCase = activateBranch;
    this.deactivateBranchUseCase = deactivateBranch;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidBranchIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof BranchNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof CompanyNotFoundForBranchError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateBranchNameError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidLocationError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, company, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listBranchesUseCase.execute({ search, company, isActive, page, limit });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de sucursales vacia' : 'Sucursales obtenidas correctamente',
        total: result.total,
        data: result.items.map(toBranchDTO),
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
      this.#handleError(res, error, 'Error obteniendo sucursales');
    }
  };

  getOne = async (req, res) => {
    try {
      const branch = await this.getBranchByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sucursal encontrada', data: toBranchDTO(branch) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo sucursal');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const branch = await this.createBranchUseCase.execute(data);
      res.status(201).json({ msj: 'Sucursal creada exitosamente', newBranch: toBranchDTO(branch) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando sucursal');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const branch = await this.updateBranchUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Sucursal actualizada correctamente', branch: toBranchDTO(branch) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando sucursal');
    }
  };

  activate = async (req, res) => {
    try {
      const branch = await this.activateBranchUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sucursal activada correctamente', branch: toBranchDTO(branch) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la sucursal');
    }
  };

  deactivate = async (req, res) => {
    try {
      const branch = await this.deactivateBranchUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Sucursal desactivada correctamente', branch: toBranchDTO(branch) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la sucursal');
    }
  };
}
