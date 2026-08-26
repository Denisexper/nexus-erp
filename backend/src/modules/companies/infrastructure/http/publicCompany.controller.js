import { CompanyNotFoundError } from '../../domain/errors.js';

export class PublicCompanyController {
  constructor({ searchPublicCompanies, getPublicCompanyBySlug }) {
    this.searchPublicCompaniesUseCase = searchPublicCompanies;
    this.getPublicCompanyBySlugUseCase = getPublicCompanyBySlug;
  }

  search = async (req, res) => {
    try {
      const { search, limit } = req.query;
      const data = await this.searchPublicCompaniesUseCase.execute({ search, limit });
      res.status(200).json({ msj: 'Empresas encontradas', data });
    } catch (error) {
      res.status(500).json({ msj: 'Error buscando empresas', error: error.message });
    }
  };

  getBySlug = async (req, res) => {
    try {
      const company = await this.getPublicCompanyBySlugUseCase.execute(req.params.slug);
      res.status(200).json({ msj: 'Empresa encontrada', data: company });
    } catch (error) {
      // Mismo 404 exista o no exista el slug, o esté inactiva la empresa:
      // no distinguimos el motivo, es una fuga de información igual.
      if (error instanceof CompanyNotFoundError) return res.status(404).json({ msj: error.message });
      res.status(500).json({ msj: 'Error obteniendo empresa', error: error.message });
    }
  };
}
