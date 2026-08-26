import { isValidGeoLocation, extractGeoId } from '#shared/lib/geoValidation.js';
import { slugify } from '#shared/lib/slugify.js';
import { CompanyNotFoundError, DuplicateSlugError, InvalidSlugError, DuplicateNitError, DuplicateNrcError, InvalidLocationError } from '../../domain/errors.js';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class UpdateCompanyUseCase {
  constructor(companyRepository, geoRepository) {
    this.companyRepository = companyRepository;
    this.geoRepository = geoRepository;
  }

  async execute(id, changes) {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new CompanyNotFoundError();

    if (changes.slug && changes.slug !== company.slug) {
      const normalizedSlug = slugify(changes.slug);
      if (!normalizedSlug || !SLUG_REGEX.test(normalizedSlug)) throw new InvalidSlugError();

      const slugTaken = await this.companyRepository.findBySlug(normalizedSlug);
      if (slugTaken) throw new DuplicateSlugError();

      changes = { ...changes, slug: normalizedSlug };
    }

    if (changes.nit && changes.nit !== company.nit) {
      const nitTaken = await this.companyRepository.findByNit(changes.nit);
      if (nitTaken) throw new DuplicateNitError();
    }

    if (changes.nrc && changes.nrc !== company.nrc) {
      const nrcTaken = await this.companyRepository.findByNrc(changes.nrc);
      if (nrcTaken) throw new DuplicateNrcError();
    }

    // Si se toca cualquier parte de la ubicación, se revalida la cadena completa
    // (no permitimos, por ejemplo, cambiar el municipio y dejar el distrito viejo).
    if (changes.department || changes.municipality || changes.district) {
      const validLocation = await isValidGeoLocation(this.geoRepository, {
        departmentId: changes.department || extractGeoId(company.department),
        municipalityId: changes.municipality || extractGeoId(company.municipality),
        districtId: changes.district || extractGeoId(company.district),
      });
      if (!validLocation) throw new InvalidLocationError();
    }

    return this.companyRepository.update(id, changes);
  }
}
