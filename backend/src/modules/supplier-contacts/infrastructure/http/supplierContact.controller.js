import {
  InvalidSupplierContactIdError,
  SupplierContactNotFoundError,
  SupplierNotFoundForSupplierContactError,
} from '../../domain/errors.js';

const toSupplierContactDTO = (supplierContact) => ({
  _id: supplierContact.id,
  id: supplierContact.id,
  supplier: supplierContact.supplier,
  fullName: supplierContact.fullName,
  phone: supplierContact.phone,
  email: supplierContact.email,
  isActive: supplierContact.isActive,
  createdAt: supplierContact.createdAt,
  updatedAt: supplierContact.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['supplier', 'fullName', 'phone', 'email'];
// `supplier` no es editable después de creado el contacto (misma regla que `branch` en warehouses).
const UPDATE_FIELDS = ['fullName', 'phone', 'email'];

export class SupplierContactController {
  constructor({ listSupplierContacts, getSupplierContactById, createSupplierContact, updateSupplierContact, activateSupplierContact, deactivateSupplierContact }) {
    this.listSupplierContactsUseCase = listSupplierContacts;
    this.getSupplierContactByIdUseCase = getSupplierContactById;
    this.createSupplierContactUseCase = createSupplierContact;
    this.updateSupplierContactUseCase = updateSupplierContact;
    this.activateSupplierContactUseCase = activateSupplierContact;
    this.deactivateSupplierContactUseCase = deactivateSupplierContact;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidSupplierContactIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof SupplierContactNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof SupplierNotFoundForSupplierContactError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, supplier, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listSupplierContactsUseCase.execute({
        search,
        companyId: req.user.companyId,
        supplier,
        isActive,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de contactos de proveedor vacia' : 'Contactos de proveedor obtenidos correctamente',
        total: result.total,
        data: result.items.map(toSupplierContactDTO),
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
      this.#handleError(res, error, 'Error obteniendo contactos de proveedor');
    }
  };

  getOne = async (req, res) => {
    try {
      const supplierContact = await this.getSupplierContactByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Contacto de proveedor encontrado', data: toSupplierContactDTO(supplierContact) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo contacto de proveedor');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const supplierContact = await this.createSupplierContactUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Contacto de proveedor creado exitosamente', newSupplierContact: toSupplierContactDTO(supplierContact) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando contacto de proveedor');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const supplierContact = await this.updateSupplierContactUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Contacto de proveedor actualizado correctamente', supplierContact: toSupplierContactDTO(supplierContact) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando contacto de proveedor');
    }
  };

  activate = async (req, res) => {
    try {
      const supplierContact = await this.activateSupplierContactUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Contacto de proveedor activado correctamente', supplierContact: toSupplierContactDTO(supplierContact) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar el contacto de proveedor');
    }
  };

  deactivate = async (req, res) => {
    try {
      const supplierContact = await this.deactivateSupplierContactUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Contacto de proveedor desactivado correctamente', supplierContact: toSupplierContactDTO(supplierContact) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar el contacto de proveedor');
    }
  };
}
