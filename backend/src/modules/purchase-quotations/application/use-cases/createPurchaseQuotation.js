import { PurchaseQuotation } from '../../domain/PurchaseQuotation.js';
import { PurchaseQuotationDetail } from '../../domain/PurchaseQuotationDetail.js';
import {
  SupplierNotFoundForQuotationError,
  EmptyPurchaseQuotationError,
  ProductNotFoundForQuotationError,
  UnitNotFoundForQuotationError,
  InvalidPurchaseUnitError,
  InvalidQuantityError,
  InvalidUnitPriceError,
  ExpenseTypeNotFoundForQuotationError,
  NoSourcesForQuotationLineError,
  PurchaseRequestDetailNotFoundForQuotationError,
  PurchaseRequestNotQuotableError,
  ProductMismatchError,
  SourceQuantityExceedsRequestError,
} from '../../domain/errors.js';
import { resolvePurchaseRequestIdsForCompany } from '#shared/lib/tenantScope.js';

// Estados de PurchaseRequest desde los que se puede seguir cotizando (ERS
// 6.8: draft -> submitted -> approved -> partially_quoted -> quoted -> ...).
const QUOTABLE_REQUEST_STATUSES = ['approved', 'partially_quoted'];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export class CreatePurchaseQuotationUseCase {
  constructor(
    purchaseQuotationRepository,
    supplierRepository,
    productRepository,
    unitRepository,
    expenseTypeRepository,
    purchaseRequestRepository,
    purchaseRequestDetailRepository,
  ) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
    this.supplierRepository = supplierRepository;
    this.productRepository = productRepository;
    this.unitRepository = unitRepository;
    this.expenseTypeRepository = expenseTypeRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
    this.purchaseRequestDetailRepository = purchaseRequestDetailRepository;
  }

  async #validateLine(line, company, requestIds) {
    if (!Array.isArray(line.sources) || line.sources.length === 0) {
      throw new NoSourcesForQuotationLineError();
    }

    const productDoc = await this.productRepository.findById(line.product, company);
    if (!productDoc) throw new ProductNotFoundForQuotationError();

    const unitDoc = await this.unitRepository.findById(line.unit, company);
    if (!unitDoc) throw new UnitNotFoundForQuotationError();
    // RN-COM (units): documentos del lado compra solo admiten unidades type=purchase.
    if (unitDoc.type !== 'purchase') throw new InvalidPurchaseUnitError();

    if (!(Number(line.unitPrice) >= 0)) throw new InvalidUnitPriceError();

    let quantity = 0;
    const resolvedSources = [];

    for (const source of line.sources) {
      if (!(Number(source.quantity) > 0)) throw new InvalidQuantityError();

      const requestDetail = await this.purchaseRequestDetailRepository.findById(source.purchaseRequestDetail, requestIds);
      if (!requestDetail) throw new PurchaseRequestDetailNotFoundForQuotationError();

      // Regla 4 del ERS: cada línea de cotización debe coincidir en producto
      // con la línea de solicitud que dice originarla.
      const requestDetailProductId = requestDetail.product?._id || requestDetail.product;
      if (String(requestDetailProductId) !== String(line.product)) throw new ProductMismatchError();

      if (Number(source.quantity) > Number(requestDetail.quantity)) throw new SourceQuantityExceedsRequestError();

      const parentRequest = await this.purchaseRequestRepository.findById(requestDetail.purchaseRequest, company);
      if (!parentRequest || !QUOTABLE_REQUEST_STATUSES.includes(parentRequest.status)) {
        throw new PurchaseRequestNotQuotableError();
      }

      quantity += Number(source.quantity);
      resolvedSources.push({
        purchaseRequestDetail: source.purchaseRequestDetail,
        quantity: Number(source.quantity),
        purchaseRequestId: requestDetail.purchaseRequest,
      });
    }

    const discount = Number(line.discount) || 0;
    const taxRate = Number(line.taxRate) || 0;
    const subtotal = round2(quantity * Number(line.unitPrice) - discount);
    const taxAmount = round2(subtotal * (taxRate / 100));
    const total = round2(subtotal + taxAmount);

    return new PurchaseQuotationDetail({
      product: line.product,
      quantity,
      unit: line.unit,
      unitPrice: Number(line.unitPrice),
      discount,
      subtotal,
      taxRate,
      taxAmount,
      total,
      deliveryDays: line.deliveryDays,
      availableQuantity: line.availableQuantity,
      notes: line.notes,
      sources: resolvedSources,
    });
  }

  async #validateExpense(expense, company) {
    const expenseTypeDoc = await this.expenseTypeRepository.findById(expense.expenseType, company);
    if (!expenseTypeDoc) throw new ExpenseTypeNotFoundForQuotationError();

    return {
      expenseType: expense.expenseType,
      description: expense.description,
      amount: round2(Number(expense.amount) || 0),
    };
  }

  // Recalcula el status de cada solicitud de origen afectada: 'quoted' si
  // todas sus líneas ya tienen al menos una cotización que las cubre,
  // 'partially_quoted' si solo algunas. Solo avanza (nunca retrocede) y solo
  // toca solicitudes que siguen en un estado cotizable.
  async #advanceSourceRequestsStatus(lines) {
    const requestIds = new Set();
    for (const line of lines) {
      for (const source of line.sources) {
        requestIds.add(String(source.purchaseRequestId));
      }
    }

    for (const requestId of requestIds) {
      const { items: requestDetails } = await this.purchaseRequestDetailRepository.findAll({
        purchaseRequest: requestId,
        limit: 1000,
      });
      const detailIds = requestDetails.map((detail) => detail.id);
      const coveredIds = await this.purchaseQuotationRepository.findCoveredRequestDetailIds(detailIds);

      const newStatus = coveredIds.length === 0
        ? null
        : (coveredIds.length >= detailIds.length ? 'quoted' : 'partially_quoted');

      if (!newStatus) continue;

      const request = await this.purchaseRequestRepository.findById(requestId);
      if (request && QUOTABLE_REQUEST_STATUSES.includes(request.status) && request.status !== newStatus) {
        await this.purchaseRequestRepository.update(requestId, { status: newStatus });
      }
    }
  }

  async execute({ supplier, quotationDate, validUntil, currency, paymentTerms, deliveryDays, notes, lines, expenses }, company, user) {
    const supplierDoc = await this.supplierRepository.findById(supplier, company);
    if (!supplierDoc) throw new SupplierNotFoundForQuotationError();

    if (!Array.isArray(lines) || lines.length === 0) throw new EmptyPurchaseQuotationError();

    const requestIds = await resolvePurchaseRequestIdsForCompany(company, this.purchaseRequestRepository);

    const resolvedLines = [];
    for (const line of lines) {
      resolvedLines.push(await this.#validateLine(line, company, requestIds));
    }

    const resolvedExpenses = [];
    for (const expense of expenses || []) {
      resolvedExpenses.push(await this.#validateExpense(expense, company));
    }

    const subtotal = round2(resolvedLines.reduce((sum, l) => sum + l.subtotal, 0));
    const discount = round2(resolvedLines.reduce((sum, l) => sum + l.discount, 0));
    const tax = round2(resolvedLines.reduce((sum, l) => sum + l.taxAmount, 0));
    const additionalExpenses = round2(resolvedExpenses.reduce((sum, e) => sum + e.amount, 0));
    const total = round2(subtotal + tax + additionalExpenses);

    const code = await this.purchaseQuotationRepository.getNextCode(company);

    const quotation = new PurchaseQuotation({
      company,
      code,
      supplier,
      quotationDate: quotationDate || new Date(),
      validUntil,
      currency,
      paymentTerms,
      deliveryDays,
      subtotal,
      discount,
      tax,
      additionalExpenses,
      total,
      notes,
      user,
      status: 'received',
    });

    const created = await this.purchaseQuotationRepository.create({ quotation, lines: resolvedLines, expenses: resolvedExpenses });

    await this.#advanceSourceRequestsStatus(resolvedLines);

    return created;
  }
}
