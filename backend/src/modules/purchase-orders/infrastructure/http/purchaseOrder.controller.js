import {
  InvalidPurchaseOrderIdError,
  PurchaseOrderNotFoundError,
  PurchaseQuotationNotFoundForOrderError,
  PurchaseQuotationNotSelectableError,
  BranchNotFoundForPurchaseOrderError,
  WarehouseNotFoundForPurchaseOrderError,
  ExpenseTypeNotFoundForOrderError,
  InvalidExpenseAmountError,
  PurchaseOrderNotEditableError,
  PurchaseOrderExpenseNotAddableError,
  InvalidPurchaseOrderStatusTransitionError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidPurchaseOrderIdError,
  PurchaseQuotationNotSelectableError,
  BranchNotFoundForPurchaseOrderError,
  WarehouseNotFoundForPurchaseOrderError,
  ExpenseTypeNotFoundForOrderError,
  InvalidExpenseAmountError,
  PurchaseOrderNotEditableError,
  PurchaseOrderExpenseNotAddableError,
  InvalidPurchaseOrderStatusTransitionError,
];

const NOT_FOUND_ERRORS = [PurchaseOrderNotFoundError, PurchaseQuotationNotFoundForOrderError];

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
  notes: detail.notes,
});

const toExpenseDTO = (expense) => ({
  _id: expense.id,
  id: expense.id,
  expenseType: expense.expenseType,
  description: expense.description,
  amount: expense.amount,
});

const toPurchaseOrderDTO = (order) => ({
  _id: order.id,
  id: order.id,
  company: order.company,
  code: order.code,
  supplier: order.supplier,
  branch: order.branch,
  warehouse: order.warehouse,
  purchaseQuotation: order.purchaseQuotation,
  orderDate: order.orderDate,
  expectedDate: order.expectedDate,
  currency: order.currency,
  paymentTerms: order.paymentTerms,
  subtotal: order.subtotal,
  discount: order.discount,
  tax: order.tax,
  additionalExpenses: order.additionalExpenses,
  total: order.total,
  status: order.status,
  notes: order.notes,
  user: order.user,
  details: (order.details || []).map(toDetailDTO),
  expenses: (order.expenses || []).map(toExpenseDTO),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const toRequestSummaryDTO = (request) => ({
  _id: request.id,
  id: request.id,
  code: request.code,
  status: request.status,
  branch: request.branch,
  warehouse: request.warehouse,
  user: request.user,
  requestDate: request.requestDate,
  requiredDate: request.requiredDate,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['purchaseQuotation', 'branch', 'warehouse', 'expectedDate', 'currency', 'paymentTerms', 'notes'];
const UPDATE_FIELDS = ['branch', 'warehouse', 'expectedDate', 'currency', 'paymentTerms', 'notes'];
const EXPENSE_FIELDS = ['expenseType', 'description', 'amount'];

export class PurchaseOrderController {
  constructor({
    listPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    addPurchaseOrderExpense,
    getPurchaseOrderTraceability,
  }) {
    this.listPurchaseOrdersUseCase = listPurchaseOrders;
    this.getPurchaseOrderByIdUseCase = getPurchaseOrderById;
    this.createPurchaseOrderUseCase = createPurchaseOrder;
    this.updatePurchaseOrderUseCase = updatePurchaseOrder;
    this.approvePurchaseOrderUseCase = approvePurchaseOrder;
    this.cancelPurchaseOrderUseCase = cancelPurchaseOrder;
    this.addPurchaseOrderExpenseUseCase = addPurchaseOrderExpense;
    this.getPurchaseOrderTraceabilityUseCase = getPurchaseOrderTraceability;
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
      const { search, status, supplier, purchaseQuotation, page = 1, limit = 10 } = req.query;
      const result = await this.listPurchaseOrdersUseCase.execute({
        search,
        companyId: req.user.companyId,
        status,
        supplier,
        purchaseQuotation,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de ordenes de compra vacia' : 'Órdenes de compra obtenidas correctamente',
        total: result.total,
        data: result.items.map(toPurchaseOrderDTO),
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
      this.#handleError(res, error, 'Error obteniendo órdenes de compra');
    }
  };

  getOne = async (req, res) => {
    try {
      const purchaseOrder = await this.getPurchaseOrderByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Orden de compra encontrada', data: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo orden de compra');
    }
  };

  getTraceability = async (req, res) => {
    try {
      const { order, quotation, requests } = await this.getPurchaseOrderTraceabilityUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({
        msj: 'Trazabilidad obtenida correctamente',
        data: {
          order: toPurchaseOrderDTO(order),
          quotation: quotation ? { _id: quotation.id, id: quotation.id, code: quotation.code, supplier: quotation.supplier, status: quotation.status, total: quotation.total } : null,
          requests: requests.map(toRequestSummaryDTO),
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo la trazabilidad de la orden de compra');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const purchaseOrder = await this.createPurchaseOrderUseCase.execute(data, req.user.companyId, req.user.id);
      res.status(201).json({ msj: 'Orden de compra creada exitosamente', newPurchaseOrder: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando orden de compra');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const purchaseOrder = await this.updatePurchaseOrderUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Orden de compra actualizada correctamente', purchaseOrder: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando orden de compra');
    }
  };

  approve = async (req, res) => {
    try {
      const purchaseOrder = await this.approvePurchaseOrderUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Orden de compra aprobada correctamente', purchaseOrder: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error al aprobar la orden de compra');
    }
  };

  cancel = async (req, res) => {
    try {
      const purchaseOrder = await this.cancelPurchaseOrderUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Orden de compra cancelada correctamente', purchaseOrder: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error al cancelar la orden de compra');
    }
  };

  addExpense = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, EXPENSE_FIELDS);
      const purchaseOrder = await this.addPurchaseOrderExpenseUseCase.execute(req.params.id, data, req.user.companyId);
      res.status(201).json({ msj: 'Gasto registrado correctamente', purchaseOrder: toPurchaseOrderDTO(purchaseOrder) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando el gasto de la orden de compra');
    }
  };
}
