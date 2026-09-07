import {
  InvalidPurchaseQuotationIdError,
  PurchaseQuotationNotFoundError,
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
  PurchaseRequestNotFoundForQuotationComparisonError,
  PurchaseQuotationNotEditableError,
  InvalidPurchaseQuotationStatusTransitionError,
} from '../../domain/errors.js';

// Errores de validación de negocio: todos responden 400 con el mensaje del
// dominio. Los que necesitan otro código (404) se listan aparte.
const BAD_REQUEST_ERRORS = [
  InvalidPurchaseQuotationIdError,
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
  PurchaseQuotationNotEditableError,
  InvalidPurchaseQuotationStatusTransitionError,
];

const NOT_FOUND_ERRORS = [PurchaseQuotationNotFoundError, PurchaseRequestNotFoundForQuotationComparisonError];

const toDetailDTO = (detail) => ({
  _id: detail.id,
  id: detail.id,
  product: detail.product,
  quantity: detail.quantity,
  unit: detail.unit,
  unitPrice: detail.unitPrice,
  discount: detail.discount,
  subtotal: detail.subtotal,
  taxRate: detail.taxRate,
  taxAmount: detail.taxAmount,
  total: detail.total,
  deliveryDays: detail.deliveryDays,
  availableQuantity: detail.availableQuantity,
  notes: detail.notes,
  sources: detail.sources?.map((s) => ({
    purchaseRequestDetail: s.purchaseRequestDetail,
    quantity: s.quantity,
  })),
});

const toExpenseDTO = (expense) => ({
  _id: expense.id,
  id: expense.id,
  expenseType: expense.expenseType,
  description: expense.description,
  amount: expense.amount,
});

const toPurchaseQuotationDTO = (quotation) => ({
  _id: quotation.id,
  id: quotation.id,
  company: quotation.company,
  code: quotation.code,
  supplier: quotation.supplier,
  quotationDate: quotation.quotationDate,
  validUntil: quotation.validUntil,
  currency: quotation.currency,
  paymentTerms: quotation.paymentTerms,
  deliveryDays: quotation.deliveryDays,
  subtotal: quotation.subtotal,
  discount: quotation.discount,
  tax: quotation.tax,
  additionalExpenses: quotation.additionalExpenses,
  total: quotation.total,
  status: quotation.status,
  notes: quotation.notes,
  user: quotation.user,
  details: (quotation.details || []).map(toDetailDTO),
  expenses: (quotation.expenses || []).map(toExpenseDTO),
  createdAt: quotation.createdAt,
  updatedAt: quotation.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

// `company` y `user` no vienen del body: se fuerzan desde req.user.
const HEADER_FIELDS = ['supplier', 'quotationDate', 'validUntil', 'currency', 'paymentTerms', 'deliveryDays', 'notes'];
const UPDATE_FIELDS = ['validUntil', 'currency', 'paymentTerms', 'deliveryDays', 'notes'];

export class PurchaseQuotationController {
  constructor({
    listPurchaseQuotations,
    getPurchaseQuotationById,
    createPurchaseQuotation,
    updatePurchaseQuotation,
    rejectPurchaseQuotation,
    cancelPurchaseQuotation,
    getPurchaseQuotationsComparison,
  }) {
    this.listPurchaseQuotationsUseCase = listPurchaseQuotations;
    this.getPurchaseQuotationByIdUseCase = getPurchaseQuotationById;
    this.createPurchaseQuotationUseCase = createPurchaseQuotation;
    this.updatePurchaseQuotationUseCase = updatePurchaseQuotation;
    this.rejectPurchaseQuotationUseCase = rejectPurchaseQuotation;
    this.cancelPurchaseQuotationUseCase = cancelPurchaseQuotation;
    this.getPurchaseQuotationsComparisonUseCase = getPurchaseQuotationsComparison;
  }

  #handleError(res, error, fallbackMsj) {
    if (BAD_REQUEST_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
      return res.status(400).json({ msj: error.message });
    }
    if (NOT_FOUND_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
      return res.status(404).json({ msj: error.message });
    }
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, status, supplier, page = 1, limit = 10 } = req.query;
      const result = await this.listPurchaseQuotationsUseCase.execute({
        search,
        companyId: req.user.companyId,
        status,
        supplier,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de cotizaciones vacia' : 'Cotizaciones de compra obtenidas correctamente',
        total: result.total,
        data: result.items.map(toPurchaseQuotationDTO),
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalRecords: result.total,
          limit: result.limit,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo cotizaciones de compra');
    }
  };

  getOne = async (req, res) => {
    try {
      const purchaseQuotation = await this.getPurchaseQuotationByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Cotización de compra encontrada', data: toPurchaseQuotationDTO(purchaseQuotation) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo cotización de compra');
    }
  };

  getComparison = async (req, res) => {
    try {
      const entries = await this.getPurchaseQuotationsComparisonUseCase.execute(req.params.purchaseRequestId, req.user.companyId);
      res.status(200).json({
        msj: entries.length === 0 ? 'no hay cotizaciones registradas para esta solicitud' : 'Comparación obtenida correctamente',
        data: entries.map(({ quotation, lines }) => ({
          quotation: toPurchaseQuotationDTO(quotation),
          lines: lines.map(toDetailDTO),
        })),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo la comparación de cotizaciones');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, HEADER_FIELDS);
      const purchaseQuotation = await this.createPurchaseQuotationUseCase.execute(
        { ...data, lines: req.body.lines, expenses: req.body.expenses },
        req.user.companyId,
        req.user.id,
      );
      res.status(201).json({ msj: 'Cotización de compra creada exitosamente', newPurchaseQuotation: toPurchaseQuotationDTO(purchaseQuotation) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando cotización de compra');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const purchaseQuotation = await this.updatePurchaseQuotationUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Cotización de compra actualizada correctamente', purchaseQuotation: toPurchaseQuotationDTO(purchaseQuotation) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando cotización de compra');
    }
  };

  reject = async (req, res) => {
    try {
      const purchaseQuotation = await this.rejectPurchaseQuotationUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Cotización de compra rechazada correctamente', purchaseQuotation: toPurchaseQuotationDTO(purchaseQuotation) });
    } catch (error) {
      this.#handleError(res, error, 'Error al rechazar la cotización de compra');
    }
  };

  cancel = async (req, res) => {
    try {
      const purchaseQuotation = await this.cancelPurchaseQuotationUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Cotización de compra cancelada correctamente', purchaseQuotation: toPurchaseQuotationDTO(purchaseQuotation) });
    } catch (error) {
      this.#handleError(res, error, 'Error al cancelar la cotización de compra');
    }
  };
}
