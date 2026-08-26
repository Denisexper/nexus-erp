import { isValidGeoLocation, extractGeoId } from '#shared/lib/geoValidation.js';
import { BranchNotFoundError, DuplicateBranchNameError, InvalidLocationError } from '../../domain/errors.js';

export class UpdateBranchUseCase {
  constructor(branchRepository, geoRepository) {
    this.branchRepository = branchRepository;
    this.geoRepository = geoRepository;
  }

  async execute(id, changes, companyId) {
    const branch = await this.branchRepository.findById(id, companyId);
    if (!branch) throw new BranchNotFoundError();

    if (changes.name && changes.name !== branch.name) {
      const nameTaken = await this.branchRepository.findByNameAndCompany(changes.name, extractGeoId(branch.company));
      if (nameTaken) throw new DuplicateBranchNameError();
    }

    if (changes.department || changes.municipality || changes.district) {
      const validLocation = await isValidGeoLocation(this.geoRepository, {
        departmentId: changes.department || extractGeoId(branch.department),
        municipalityId: changes.municipality || extractGeoId(branch.municipality),
        districtId: changes.district || extractGeoId(branch.district),
      });
      if (!validLocation) throw new InvalidLocationError();
    }

    return this.branchRepository.update(id, changes);
  }
}
