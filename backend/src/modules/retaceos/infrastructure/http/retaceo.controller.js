import {
  InvalidRetaceoIdError,
  RetaceoNotFoundError,
  PurchaseOrderNotFoundForRetaceoError,
  PurchaseOrderNotRetaceableError,
  PurchaseOrderAlreadyRetaceadoError,
  InvalidDaiAmountError,
  InvalidFreightAmountError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidRetaceoIdError,
  PurchaseOrderNotRetaceableError,
  PurchaseOrderAlreadyRetaceadoError,
  InvalidDaiAmountError,
  InvalidFreightAmountError,
];

const NOT_FOUND_ERRORS = [RetaceoNotFoundError, PurchaseOrderNotFoundForRetaceoError];

const toDetailDTO = (detail) => ({
  _id: detail.id,
  id: detail.id,
  product: detail.product,
  quantity: detail.quantity,
  costFob: detail.costFob,
  freightAmount: detail.freightAmount,
  expenseAmount: detail.expenseAmount,
  daiAmount: detail.daiAmount,
  unitCost: detail.unitCost,
  totalCost: detail.totalCost,
});

const toRetaceoDTO = (retaceo) => ({
  _id: retaceo.id,
  id: retaceo.id,
  company: retaceo.company,
  code: retaceo.code,
  purchaseOrder: retaceo.purchaseOrder,
  supplier: retaceo.supplier,
  retaceoDate: retaceo.retaceoDate,
  originCountry: retaceo.originCountry,
  importInvoiceNumber: retaceo.importInvoiceNumber,
  importInvoiceDate: retaceo.importInvoiceDate,
  importPolicyNumber: retaceo.importPolicyNumber,
  importPolicyDate: retaceo.importPolicyDate,
  totalFob: retaceo.totalFob,
  totalFreight: retaceo.totalFreight,
  totalExpenses: retaceo.totalExpenses,
  totalDai: retaceo.totalDai,
  totalCost: retaceo.totalCost,
  status: retaceo.status,
  notes: retaceo.notes,
  user: retaceo.user,
  details: (retaceo.details || []).map(toDetailDTO),
  createdAt: retaceo.createdAt,
  updatedAt: retaceo.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = [
  'purchaseOrder',
  'retaceoDate',
  'originCountry',
  'importInvoiceNumber',
  'importInvoiceDate',
  'importPolicyNumber',
  'importPolicyDate',
  'totalFreight',
  'totalDai',
  'notes',
];

export class RetaceoController {
  constructor({ listRetaceos, getRetaceoById, createRetaceo }) {
    this.listRetaceosUseCase = listRetaceos;
    this.getRetaceoByIdUseCase = getRetaceoById;
    this.createRetaceoUseCase = createRetaceo;
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
      const result = await this.listRetaceosUseCase.execute({
        search,
        companyId: req.user.companyId,
        status,
        supplier,
        purchaseOrder,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de retaceos vacia' : 'Retaceos obtenidos correctamente',
        total: result.total,
        data: result.items.map(toRetaceoDTO),
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
      this.#handleError(res, error, 'Error obteniendo retaceos');
    }
  };

  getOne = async (req, res) => {
    try {
      const retaceo = await this.getRetaceoByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Retaceo encontrado', data: toRetaceoDTO(retaceo) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo retaceo');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const retaceo = await this.createRetaceoUseCase.execute(data, req.user.companyId, req.user.id);
      res.status(201).json({ msj: 'Retaceo registrado exitosamente', newRetaceo: toRetaceoDTO(retaceo) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando retaceo');
    }
  };
}
