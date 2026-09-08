import { PurchaseOrder } from '../../domain/PurchaseOrder.js';
import {
  PurchaseQuotationNotFoundForOrderError,
  PurchaseQuotationNotSelectableError,
  BranchNotFoundForPurchaseOrderError,
  WarehouseNotFoundForPurchaseOrderError,
} from '../../domain/errors.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Solicitudes desde las que todavía tiene sentido avanzar el status al
// generar una orden (ERS 6.8: ... -> partially_quoted -> quoted ->
// partially_ordered -> completed). Nunca se retrocede ni se toca una
// solicitud rechazada/cancelada.
const ORDERABLE_REQUEST_STATUSES = ['approved', 'partially_quoted', 'quoted', 'partially_ordered'];

// RN-COM-010: una orden se genera copiando íntegramente la cotización
// seleccionada (cabecera + líneas + gastos) — no hay tabla puente entre
// purchase_order_details y purchase_quotation_details en el modelo del ERS,
// así que no se admite selección parcial de líneas. Si algo salió mal, se
// cancela la orden y se vuelve a generar (misma filosofía que quotations).
export class CreatePurchaseOrderUseCase {
  constructor(purchaseOrderRepository, purchaseQuotationRepository, branchRepository, warehouseRepository, purchaseRequestRepository, purchaseRequestDetailRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.purchaseQuotationRepository = purchaseQuotationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
  }

  // Avanza cada solicitud vinculada a la cotización de origen a
  // 'partially_ordered' o 'completed' según si todas sus líneas ya quedaron
  // cubiertas por una cotización seleccionada (con orden generada).
  async #advanceSourceRequestsStatus(quotationId) {
    const requestIds = await this.purchaseQuotationRepository.findRequestIdsForQuotation(quotationId);

    for (const requestId of requestIds) {
      const { items: requestDetails } = await this.purchaseRequestDetailRepository.findAll({
        purchaseRequest: requestId,
        limit: 1000,
      });
      const detailIds = requestDetails.map((detail) => detail.id);
      const orderedIds = await this.purchaseQuotationRepository.findOrderedRequestDetailIds(detailIds);

      const newStatus = orderedIds.length === 0
        ? null
        : (orderedIds.length >= detailIds.length ? 'completed' : 'partially_ordered');

      if (!newStatus) continue;

      const request = await this.purchaseRequestRepository.findById(requestId);
      if (request && ORDERABLE_REQUEST_STATUSES.includes(request.status) && request.status !== newStatus) {
        await this.purchaseRequestRepository.update(requestId, { status: newStatus });
      }
    }
  }

  async execute({ purchaseQuotation, branch, warehouse, expectedDate, currency, paymentTerms, notes }, company, user) {
    const quotation = await this.purchaseQuotationRepository.findById(purchaseQuotation, company);
    if (!quotation) throw new PurchaseQuotationNotFoundForOrderError();
    if (quotation.status !== 'received') throw new PurchaseQuotationNotSelectableError();

    const branchDoc = await this.branchRepository.findById(branch, company);
    if (!branchDoc) throw new BranchNotFoundForPurchaseOrderError();

    // El almacén debe pertenecer justo a la sucursal elegida, no solo a la
    // empresa (mismo criterio que purchase-requests).
    const warehouseDoc = await this.warehouseRepository.findById(warehouse, [branch]);
    if (!warehouseDoc) throw new WarehouseNotFoundForPurchaseOrderError();

    // RN-COM-014: el proveedor de la orden es el de la cotización elegida,
    // no un dato que el usuario pueda decidir aparte (evita inconsistencias).
    const supplier = quotation.supplier?._id || quotation.supplier;

    const lines = quotation.details.map((detail) => ({
      product: detail.product?._id || detail.product,
      quantity: detail.quantity,
      unit: detail.unit?._id || detail.unit,
      unitPrice: detail.unitPrice,
      discount: detail.discount,
      subtotal: detail.subtotal,
      taxRate: detail.taxRate,
      taxAmount: detail.taxAmount,
      total: detail.total,
      notes: detail.notes,
    }));

    const expenses = quotation.expenses.map((expense) => ({
      expenseType: expense.expenseType?._id || expense.expenseType,
      description: expense.description,
      amount: expense.amount,
    }));

    const subtotal = round2(lines.reduce((sum, l) => sum + l.subtotal, 0));
    const discount = round2(lines.reduce((sum, l) => sum + l.discount, 0));
    const tax = round2(lines.reduce((sum, l) => sum + l.taxAmount, 0));
    const additionalExpenses = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
    const total = round2(subtotal + tax + additionalExpenses);

    const code = await this.purchaseOrderRepository.getNextCode(company);

    const order = new PurchaseOrder({
      company,
      code,
      supplier,
      branch,
      warehouse,
      purchaseQuotation: quotation.id,
      user,
      orderDate: new Date(),
      expectedDate,
      currency: currency || quotation.currency,
      paymentTerms: paymentTerms || quotation.paymentTerms,
      subtotal,
      discount,
      tax,
      additionalExpenses,
      total,
      notes,
      status: 'draft',
    });

    const created = await this.purchaseOrderRepository.create({ order, lines, expenses });

    // RN-COM-016 vía dominio: 'selected' queda reservado en purchase-quotations
    // justo para que este módulo lo marque al generar la orden.
    await this.purchaseQuotationRepository.update(quotation.id, { status: 'selected' });
    await this.#advanceSourceRequestsStatus(quotation.id);

    return created;
  }
}
