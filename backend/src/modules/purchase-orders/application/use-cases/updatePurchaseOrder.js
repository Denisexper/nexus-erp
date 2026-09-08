import {
  PurchaseOrderNotFoundError,
  PurchaseOrderNotEditableError,
  BranchNotFoundForPurchaseOrderError,
  WarehouseNotFoundForPurchaseOrderError,
} from '../../domain/errors.js';

// Solo campos de cabecera; las líneas y el proveedor vienen fijos desde la
// cotización de origen y no se editan una vez creada la orden (si están mal,
// se cancela y se genera una nueva), mismo criterio que purchase-quotations.
export class UpdatePurchaseOrderUseCase {
  constructor(purchaseOrderRepository, branchRepository, warehouseRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(id, changes, companyId) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id, companyId);
    if (!purchaseOrder) throw new PurchaseOrderNotFoundError();

    if (purchaseOrder.status !== 'draft') throw new PurchaseOrderNotEditableError();

    const nextBranch = changes.branch || purchaseOrder.branch?._id || purchaseOrder.branch;

    if (changes.branch) {
      const branchDoc = await this.branchRepository.findById(changes.branch, companyId);
      if (!branchDoc) throw new BranchNotFoundForPurchaseOrderError();
    }

    if (changes.warehouse) {
      const warehouseDoc = await this.warehouseRepository.findById(changes.warehouse, [nextBranch]);
      if (!warehouseDoc) throw new WarehouseNotFoundForPurchaseOrderError();
    }

    return this.purchaseOrderRepository.update(id, changes);
  }
}
