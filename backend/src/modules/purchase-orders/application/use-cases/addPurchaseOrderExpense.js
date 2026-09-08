import {
  PurchaseOrderNotFoundError,
  PurchaseOrderExpenseNotAddableError,
  ExpenseTypeNotFoundForOrderError,
} from '../../domain/errors.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// A diferencia de purchase-quotations (gastos fijados solo al crear), la
// orden sí admite registrar gastos después de creada (CU-086) — en la
// práctica surgen costos como flete recién al coordinar el envío. Se permite
// mientras la orden siga activa (no cancelada/cerrada).
const ADDABLE_EXPENSE_STATUSES = ['draft', 'approved', 'sent', 'partially_received', 'received'];

export class AddPurchaseOrderExpenseUseCase {
  constructor(purchaseOrderRepository, expenseTypeRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async execute(id, { expenseType, description, amount }, companyId) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id, companyId);
    if (!purchaseOrder) throw new PurchaseOrderNotFoundError();

    if (!ADDABLE_EXPENSE_STATUSES.includes(purchaseOrder.status)) {
      throw new PurchaseOrderExpenseNotAddableError();
    }

    const expenseTypeDoc = await this.expenseTypeRepository.findById(expenseType, companyId);
    if (!expenseTypeDoc) throw new ExpenseTypeNotFoundForOrderError();

    return this.purchaseOrderRepository.addExpense(id, {
      expenseType,
      description,
      amount: round2(Number(amount) || 0),
    });
  }
}
