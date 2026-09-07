import { PurchaseRequest } from '../../domain/PurchaseRequest.js';
import {
  BranchNotFoundForPurchaseRequestError,
  WarehouseNotFoundForPurchaseRequestError,
} from '../../domain/errors.js';

export class CreatePurchaseRequestUseCase {
  constructor(purchaseRequestRepository, branchRepository, warehouseRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute({ branch, warehouse, requiredDate, justification, notes, company, user }) {
    const branchDoc = await this.branchRepository.findById(branch, company);
    if (!branchDoc) throw new BranchNotFoundForPurchaseRequestError();

    // El almacén debe pertenecer justo a la sucursal elegida, no solo a la
    // empresa (misma validación que warehouse->branch en locations).
    const warehouseDoc = await this.warehouseRepository.findById(warehouse, [branch]);
    if (!warehouseDoc) throw new WarehouseNotFoundForPurchaseRequestError();

    const code = await this.purchaseRequestRepository.getNextCode(company);

    const purchaseRequest = new PurchaseRequest({
      company,
      code,
      branch,
      warehouse,
      user,
      requestDate: new Date(),
      requiredDate,
      justification,
      notes,
      status: 'draft',
    });

    return this.purchaseRequestRepository.create(purchaseRequest);
  }
}
