import { isValidGeoLocation } from '#shared/lib/geoValidation.js';
import { Branch } from '../../domain/Branch.js';
import { CompanyNotFoundForBranchError, InactiveCompanyForBranchError, DuplicateBranchNameError, InvalidLocationError } from '../../domain/errors.js';

export class CreateBranchUseCase {
  constructor(branchRepository, companyRepository, geoRepository) {
    this.branchRepository = branchRepository;
    this.companyRepository = companyRepository;
    this.geoRepository = geoRepository;
  }

  async execute(data) {
    // RN-BRA-001: toda sucursal debe pertenecer a una empresa existente.
    const company = await this.companyRepository.findById(data.company);
    if (!company) throw new CompanyNotFoundForBranchError();
    if (!company.isActive) throw new InactiveCompanyForBranchError();

    // RN-BRA-005: nombre único dentro de la misma empresa (no global).
    const nameTaken = await this.branchRepository.findByNameAndCompany(data.name, data.company);
    if (nameTaken) throw new DuplicateBranchNameError();

    // RN-BRA-006: dirección geográfica válida.
    const validLocation = await isValidGeoLocation(this.geoRepository, {
      departmentId: data.department,
      municipalityId: data.municipality,
      districtId: data.district,
    });
    if (!validLocation) throw new InvalidLocationError();

    const branch = new Branch(data);
    return this.branchRepository.create(branch);
  }
}
