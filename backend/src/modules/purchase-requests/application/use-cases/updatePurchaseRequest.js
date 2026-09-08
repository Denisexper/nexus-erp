import {
  PurchaseRequestNotFoundError,
  PurchaseRequestNotEditableError,
  BranchNotFoundForPurchaseRequestError,
  WarehouseNotFoundForPurchaseRequestError,
} from '../../domain/errors.js';

export class UpdatePurchaseRequestUseCase {
  constructor(purchaseRequestRepository, branchRepository, warehouseRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, changes, companyId) {
    const purchaseRequest = await this.purchaseRequestRepository.findById(id, companyId);
    if (!purchaseRequest) throw new PurchaseRequestNotFoundError();

    // RN: solo se edita mientras está en borrador. Una vez enviada, la
    // solicitud queda congelada (igual criterio que el detalle de líneas).
    if (purchaseRequest.status !== 'draft') throw new PurchaseRequestNotEditableError();

    const nextBranch = changes.branch || purchaseRequest.branch;
    const nextWarehouse = changes.warehouse || purchaseRequest.warehouse;

    if (changes.branch) {
      const branchDoc = await this.branchRepository.findById(changes.branch, companyId);
      if (!branchDoc) throw new BranchNotFoundForPurchaseRequestError();
    }

    if (changes.branch || changes.warehouse) {
      const warehouseDoc = await this.warehouseRepository.findById(nextWarehouse, [nextBranch]);
      if (!warehouseDoc) throw new WarehouseNotFoundForPurchaseRequestError();
    }

    return this.purchaseRequestRepository.update(id, changes);
  }
}
