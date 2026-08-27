import { isValidGeoLocation } from '#shared/lib/geoValidation.js';
import { slugify } from '#shared/lib/slugify.js';
import { Company } from '../../domain/Company.js';
import { DuplicateNitError, DuplicateNrcError, InvalidLocationError } from '../../domain/errors.js';

export class CreateCompanyUseCase {
  /**
   * @param {import('../../domain/CompanyRepository.js').CompanyRepository} companyRepository
   * @param {import('#modules/geo/domain/GeoRepository.js').GeoRepository} geoRepository
   * @param {(companyId: string) => Promise<void>} seedRolesForCompany - siembra
   *   admin/moderator/user para la empresa recién creada (ver seedRoles.js)
   */
  constructor(companyRepository, geoRepository, seedRolesForCompany) {
    this.companyRepository = companyRepository;
    this.geoRepository = geoRepository;
    this.seedRolesForCompany = seedRolesForCompany;
  }

  async #generateUniqueSlug(seed) {
    const base = slugify(seed);
    let candidate = base;
    let suffix = 2;

    while (await this.companyRepository.findBySlug(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async execute(data) {
    const nitTaken = await this.companyRepository.findByNit(data.nit);
    if (nitTaken) throw new DuplicateNitError();

    const nrcTaken = await this.companyRepository.findByNrc(data.nrc);
    if (nrcTaken) throw new DuplicateNrcError();

    const validLocation = await isValidGeoLocation(this.geoRepository, {
      departmentId: data.department,
      municipalityId: data.municipality,
      districtId: data.district,
    });
    if (!validLocation) throw new InvalidLocationError();

    const slug = await this.#generateUniqueSlug(data.commercialName || data.name);

    const company = new Company({ ...data, slug });
    const created = await this.companyRepository.create(company);

    // Sin esto la empresa queda sin ningún rol y nadie podría loguearse en
    // su tenant (login exige {slug, email, password} + un rol resuelto).
    await this.seedRolesForCompany(created.id);

    return created;
  }
}
