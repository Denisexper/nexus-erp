import {
  InvalidCompanyIdError,
  CompanyNotFoundError,
  DuplicateSlugError,
  InvalidSlugError,
  DuplicateNitError,
  DuplicateNrcError,
  InvalidLocationError,
} from '../../domain/errors.js';

// Traduce la entidad de dominio (que usa `id`, y department/municipality/
// district pueden venir como subdocumento poblado o como id crudo) a la
// forma que consume el frontend.
const toCompanyDTO = (company) => ({
  _id: company.id,
  id: company.id,
  name: company.name,
  commercialName: company.commercialName,
  slug: company.slug,
  nit: company.nit,
  nrc: company.nrc,
  commercialLine1: company.commercialLine1,
  commercialLine2: company.commercialLine2,
  commercialLine3: company.commercialLine3,
  address: company.address,
  department: company.department,
  municipality: company.municipality,
  district: company.district,
  phone: company.phone,
  email: company.email,
  webSite: company.webSite,
  logo: company.logo,
  isActive: company.isActive,
  createdAt: company.createdAt,
  updatedAt: company.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const COMPANY_FIELDS = [
  'name',
  'commercialName',
  'slug',
  'nit',
  'nrc',
  'commercialLine1',
  'commercialLine2',
  'commercialLine3',
  'address',
  'department',
  'municipality',
  'district',
  'phone',
  'email',
  'webSite',
  'logo',
];

export class CompanyController {
  constructor({ listCompanies, getCompanyById, createCompany, updateCompany, activateCompany, deactivateCompany }) {
    this.listCompaniesUseCase = listCompanies;
    this.getCompanyByIdUseCase = getCompanyById;
    this.createCompanyUseCase = createCompany;
    this.updateCompanyUseCase = updateCompany;
    this.activateCompanyUseCase = activateCompany;
    this.deactivateCompanyUseCase = deactivateCompany;
  }

  // Único lugar del módulo que traduce errores de dominio a códigos HTTP.
  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidCompanyIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof CompanyNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof DuplicateSlugError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidSlugError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateNitError) return res.status(400).json({ msj: error.message });
    if (error instanceof DuplicateNrcError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidLocationError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, isActive, page = 1, limit = 10 } = req.query;
      const result = await this.listCompaniesUseCase.execute({ search, isActive, page, limit });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de empresas vacia' : 'Empresas obtenidas correctamente',
        total: result.total,
        data: result.items.map(toCompanyDTO),
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
      this.#handleError(res, error, 'Error obteniendo empresas');
    }
  };

  getOne = async (req, res) => {
    try {
      const company = await this.getCompanyByIdUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Empresa encontrada', data: toCompanyDTO(company) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo empresa');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, COMPANY_FIELDS);
      const company = await this.createCompanyUseCase.execute(data);
      res.status(201).json({ msj: 'Empresa creada exitosamente', newCompany: toCompanyDTO(company) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando empresa');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, [...COMPANY_FIELDS, 'isActive']);
      const company = await this.updateCompanyUseCase.execute(req.params.id, changes);
      res.status(200).json({ msj: 'Empresa actualizada correctamente', company: toCompanyDTO(company) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando empresa');
    }
  };

  activate = async (req, res) => {
    try {
      const company = await this.activateCompanyUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Empresa activada correctamente', company: toCompanyDTO(company) });
    } catch (error) {
      this.#handleError(res, error, 'Error al activar la empresa');
    }
  };

  deactivate = async (req, res) => {
    try {
      const company = await this.deactivateCompanyUseCase.execute(req.params.id);
      res.status(200).json({ msj: 'Empresa desactivada correctamente', company: toCompanyDTO(company) });
    } catch (error) {
      this.#handleError(res, error, 'Error al desactivar la empresa');
    }
  };
}
