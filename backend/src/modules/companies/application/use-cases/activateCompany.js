import { CompanyNotFoundError } from '../../domain/errors.js';

// Simétrico a DeactivateCompanyUseCase: reactivar una empresa reactiva todas
// sus sucursales (y, transitivamente, almacenes y ubicaciones) vía
// ActivateBranchUseCase.
export class ActivateCompanyUseCase {
  constructor(companyRepository, branchRepository, activateBranchUseCase) {
    this.companyRepository = companyRepository;
    this.branchRepository = branchRepository;
    this.activateBranchUseCase = activateBranchUseCase;
  }

  async execute(id, companyId) {
    const company = await this.companyRepository.findById(id, companyId);
    if (!company) throw new CompanyNotFoundError();

    const updated = await this.companyRepository.update(id, { isActive: true });

    const { items: branches } = await this.branchRepository.findAll({ company: id, isActive: false, limit: 10000 });
    for (const branch of branches) {
      await this.activateBranchUseCase.execute(branch.id, id);
    }

    return updated;
  }
}
