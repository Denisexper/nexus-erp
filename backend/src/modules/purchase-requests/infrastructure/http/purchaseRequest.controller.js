import {
  InvalidPurchaseRequestIdError,
  PurchaseRequestNotFoundError,
  BranchNotFoundForPurchaseRequestError,
  WarehouseNotFoundForPurchaseRequestError,
  PurchaseRequestNotEditableError,
  InvalidPurchaseRequestStatusTransitionError,
  EmptyPurchaseRequestError,
} from '../../domain/errors.js';

const toPurchaseRequestDTO = (purchaseRequest) => ({
  _id: purchaseRequest.id,
  id: purchaseRequest.id,
  company: purchaseRequest.company,
  code: purchaseRequest.code,
  branch: purchaseRequest.branch,
  warehouse: purchaseRequest.warehouse,
  user: purchaseRequest.user,
  requestDate: purchaseRequest.requestDate,
  requiredDate: purchaseRequest.requiredDate,
  justification: purchaseRequest.justification,
  status: purchaseRequest.status,
  notes: purchaseRequest.notes,
  createdAt: purchaseRequest.createdAt,
  updatedAt: purchaseRequest.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

// `company` y `user` no vienen del body: se fuerzan desde req.user, nunca se
// confía en lo que mande el cliente.
const FIELDS = ['branch', 'warehouse', 'requiredDate', 'justification', 'notes'];

export class PurchaseRequestController {
  constructor({
    listPurchaseRequests,
    getPurchaseRequestById,
    createPurchaseRequest,
    updatePurchaseRequest,
    submitPurchaseRequest,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    cancelPurchaseRequest,
  }) {
    this.listPurchaseRequestsUseCase = listPurchaseRequests;
    this.getPurchaseRequestByIdUseCase = getPurchaseRequestById;
    this.createPurchaseRequestUseCase = createPurchaseRequest;
    this.updatePurchaseRequestUseCase = updatePurchaseRequest;
    this.submitPurchaseRequestUseCase = submitPurchaseRequest;
    this.approvePurchaseRequestUseCase = approvePurchaseRequest;
    this.rejectPurchaseRequestUseCase = rejectPurchaseRequest;
    this.cancelPurchaseRequestUseCase = cancelPurchaseRequest;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidPurchaseRequestIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseRequestNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof BranchNotFoundForPurchaseRequestError) return res.status(400).json({ msj: error.message });
    if (error instanceof WarehouseNotFoundForPurchaseRequestError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseRequestNotEditableError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidPurchaseRequestStatusTransitionError) return res.status(400).json({ msj: error.message });
    if (error instanceof EmptyPurchaseRequestError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { search, status, branch, warehouse, page = 1, limit = 10 } = req.query;
      const result = await this.listPurchaseRequestsUseCase.execute({
        search,
        companyId: req.user.companyId,
        status,
        branch,
        warehouse,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de solicitudes de compra vacia' : 'Solicitudes de compra obtenidas correctamente',
        total: result.total,
        data: result.items.map(toPurchaseRequestDTO),
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
      this.#handleError(res, error, 'Error obteniendo solicitudes de compra');
    }
  };

  getOne = async (req, res) => {
    try {
      const purchaseRequest = await this.getPurchaseRequestByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra encontrada', data: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo solicitud de compra');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, FIELDS);
      const purchaseRequest = await this.createPurchaseRequestUseCase.execute({
        ...data,
        company: req.user.companyId,
        user: req.user.id,
      });
      res.status(201).json({ msj: 'Solicitud de compra creada exitosamente', newPurchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando solicitud de compra');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, FIELDS);
      const purchaseRequest = await this.updatePurchaseRequestUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra actualizada correctamente', purchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando solicitud de compra');
    }
  };

  submit = async (req, res) => {
    try {
      const purchaseRequest = await this.submitPurchaseRequestUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra enviada correctamente', purchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error al enviar la solicitud de compra');
    }
  };

  approve = async (req, res) => {
    try {
      const purchaseRequest = await this.approvePurchaseRequestUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra aprobada correctamente', purchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error al aprobar la solicitud de compra');
    }
  };

  reject = async (req, res) => {
    try {
      const purchaseRequest = await this.rejectPurchaseRequestUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra rechazada correctamente', purchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error al rechazar la solicitud de compra');
    }
  };

  cancel = async (req, res) => {
    try {
      const purchaseRequest = await this.cancelPurchaseRequestUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Solicitud de compra cancelada correctamente', purchaseRequest: toPurchaseRequestDTO(purchaseRequest) });
    } catch (error) {
      this.#handleError(res, error, 'Error al cancelar la solicitud de compra');
    }
  };
}
