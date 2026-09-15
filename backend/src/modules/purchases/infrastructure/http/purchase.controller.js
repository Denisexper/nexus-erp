import {
  InvalidPurchaseIdError,
  PurchaseNotFoundError,
  PurchaseOrderNotFoundForPurchaseError,
  PurchaseOrderNotReceivableError,
  PurchaseOrderDetailNotFoundError,
  QuantityReceivedExceedsOrderedError,
  InvalidQuantityReceivedError,
  EmptyPurchaseError,
  PurchaseNotCancellableError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidPurchaseIdError,
  PurchaseOrderNotReceivableError,
  PurchaseOrderDetailNotFoundError,
  QuantityReceivedExceedsOrderedError,
  InvalidQuantityReceivedError,
  EmptyPurchaseError,
  PurchaseNotCancellableError,
];

const NOT_FOUND_ERRORS = [PurchaseNotFoundError, PurchaseOrderNotFoundForPurchaseError];

const toDetailDTO = (detail) => ({
  _id: detail.id,
  id: detail.id,
  purchaseOrderDetail: detail.purchaseOrderDetail,
  product: detail.product,
  quantityOrdered: detail.quantityOrdered,
  quantityReceived: detail.quantityReceived,
  unit: detail.unit,
  unitPrice: detail.unitPrice,
  discount: detail.discount,
  subtotal: detail.subtotal,
  taxRate: detail.taxRate,
  taxAmount: detail.taxAmount,
  total: detail.total,
  notes: detail.notes,
});

const toPurchaseDTO = (purchase) => ({
  _id: purchase.id,
  id: purchase.id,
  company: purchase.company,
  code: purchase.code,
  purchaseOrder: purchase.purchaseOrder,
  supplier: purchase.supplier,
  branch: purchase.branch,
  warehouse: purchase.warehouse,
  purchaseDate: purchase.purchaseDate,
  supplierInvoiceNumber: purchase.supplierInvoiceNumber,
  supplierInvoiceDate: purchase.supplierInvoiceDate,
  currency: purchase.currency,
  subtotal: purchase.subtotal,
  discount: purchase.discount,
  tax: purchase.tax,
  total: purchase.total,
  status: purchase.status,
  notes: purchase.notes,
  user: purchase.user,
  details: (purchase.details || []).map(toDetailDTO),
  createdAt: purchase.createdAt,
  updatedAt: purchase.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['purchaseOrder', 'purchaseDate', 'supplierInvoiceNumber', 'supplierInvoiceDate', 'currency', 'notes', 'lines'];

export class PurchaseController {
  constructor({ listPurchases, getPurchaseById, createPurchase, cancelPurchase }) {
    this.listPurchasesUseCase = listPurchases;
    this.getPurchaseByIdUseCase = getPurchaseById;
    this.createPurchaseUseCase = createPurchase;
    this.cancelPurchaseUseCase = cancelPurchase;
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
      const { search, status, supplier, purchaseOrder, page = 1, limit = 10 } = req.query;
      const result = await this.listPurchasesUseCase.execute({
        search,
        companyId: req.user.companyId,
        status,
        supplier,
        purchaseOrder,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de compras vacia' : 'Compras obtenidas correctamente',
        total: result.total,
        data: result.items.map(toPurchaseDTO),
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
      this.#handleError(res, error, 'Error obteniendo compras');
    }
  };

  getOne = async (req, res) => {
    try {
      const purchase = await this.getPurchaseByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Compra encontrada', data: toPurchaseDTO(purchase) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo compra');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const purchase = await this.createPurchaseUseCase.execute(data, req.user.companyId, req.user.id);
      res.status(201).json({ msj: 'Compra registrada exitosamente', newPurchase: toPurchaseDTO(purchase) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando compra');
    }
  };

  cancel = async (req, res) => {
    try {
      const purchase = await this.cancelPurchaseUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Compra cancelada correctamente', purchase: toPurchaseDTO(purchase) });
    } catch (error) {
      this.#handleError(res, error, 'Error al cancelar la compra');
    }
  };
}
