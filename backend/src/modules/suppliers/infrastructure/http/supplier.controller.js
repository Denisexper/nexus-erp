import {
  InvalidSupplierIdError,
  SupplierNotFoundError,
  CountryNotFoundForSupplierError,
  DuplicateSupplierCodeError,
} from '../../domain/errors.js';

const toSupplierDTO = (supplier) => ({
  _id: supplier.id,
  id: supplier.id,
  company: supplier.company,
  code: supplier.code,
  country: supplier.country,
  name: supplier.name,
  address: supplier.address,
  phone: supplier.phone,
  email: supplier.email,
  website: supplier.website,
  isActive: supplier.isActive,
  createdAt: supplier.createdAt,
  updatedAt: supplier.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const SUPPLIER_FIELDS = ['code', 'country', 'name', 'address', 'phone', 'email', 'website'];

export class SupplierController {
  constructor({ listSuppliers, getSupplierById, createSupplier, updateSupplier, activateSupplier, deactivateSupplier }) {
    this.listSuppliersUseCase = listSuppliers;
    this.getSupplierByIdUseCase = getSupplierById;
    this.createSupplierUseCase = createSupplier;
    this.updateSupplierUseCase = updateSupplier;
    this.activateSupplierUseCase = activateSupplier;
    this.deactivateSupplierUseCase = deactivateSupplier;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidSupplierIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof SupplierNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof CountryNotFoundForSupplierError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateSupplierCodeError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, country, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listSuppliersUseCase.execute({
        search,
        companyId: req.user.companyId,
        country,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de proveedores vacia' : 'Proveedores obtenidos correctamente',
        total: result.total,
        data: result.items.map(toSupplierDTO),
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
      this.#handleError(res, error, 'Error obteniendo proveedores');
    }
  };

  getOne = async (req, res) => {
    try {
      const supplier = await this.getSupplierByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Proveedor encontrado', data: toSupplierDTO(supplier) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo proveedor');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, SUPPLIER_FIELDS);
      const supplier = await this.createSupplierUseCase.execute({ ...data, company: req.user.companyId });
      res.status(201).json({ msj: 'Proveedor creado exitosamente', newSupplier: toSupplierDTO(supplier) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando proveedor');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, SUPPLIER_FIELDS);
      const supplier = await this.updateSupplierUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Proveedor actualizado correctamente', supplier: toSupplierDTO(supplier) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando proveedor');
    }
  };

  activate = async (req, res) => {
    try {
      const supplier = await this.activateSupplierUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Proveedor activado correctamente', supplier: toSupplierDTO(supplier) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el proveedor');
    }
  };

  deactivate = async (req, res) => {
    try {
      const supplier = await this.deactivateSupplierUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Proveedor desactivado correctamente', supplier: toSupplierDTO(supplier) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el proveedor');
    }
  };
}
