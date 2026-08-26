import { BranchNotFoundError } from '../../domain/errors.js';

export class DeactivateBranchUseCase {
  constructor(branchRepository) {
    this.branchRepository = branchRepository;
  }

  async execute(id, companyId) {
    const branch = await this.branchRepository.findById(id, companyId);
    if (!branch) throw new BranchNotFoundError();

    return this.branchRepository.update(id, { isActive: false });
  }
}
