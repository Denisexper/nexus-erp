import { isValidGeoLocation } from '#shared/lib/geoValidation.js';
import { slugify } from '#shared/lib/slugify.js';
import { Company } from '../../domain/Company.js';
import { DuplicateNitError, DuplicateNrcError, InvalidLocationError } from '../../domain/errors.js';

export class CreateCompanyUseCase {
  constructor(companyRepository, geoRepository) {
    this.companyRepository = companyRepository;
    this.geoRepository = geoRepository;
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
    return this.companyRepository.create(company);
  }
}
