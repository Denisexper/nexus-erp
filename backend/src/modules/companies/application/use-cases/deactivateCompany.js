import { CompanyNotFoundError } from '../../domain/errors.js';

// RN-EMP-005: una empresa inactiva no genera transacciones nuevas. En
// cascada, todas sus sucursales (y, transitivamente, almacenes y
// ubicaciones) se desactivan vía DeactivateBranchUseCase.
export class DeactivateCompanyUseCase {
  constructor(companyRepository, branchRepository, deactivateBranchUseCase) {
    this.companyRepository = companyRepository;
    this.branchRepository = branchRepository;
    this.deactivateBranchUseCase = deactivateBranchUseCase;
  }

  async execute(id, companyId) {
    const company = await this.companyRepository.findById(id, companyId);
    if (!company) throw new CompanyNotFoundError();

    const updated = await this.companyRepository.update(id, { isActive: false });

    const { items: branches } = await this.branchRepository.findAll({ company: id, isActive: true, limit: 10000 });
    for (const branch of branches) {
      await this.deactivateBranchUseCase.execute(branch.id, id);
    }

    return updated;
  }
}
