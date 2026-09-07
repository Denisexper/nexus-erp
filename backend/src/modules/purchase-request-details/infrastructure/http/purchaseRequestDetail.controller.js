import {
  InvalidPurchaseRequestDetailIdError,
  PurchaseRequestDetailNotFoundError,
  PurchaseRequestNotFoundForDetailError,
  PurchaseRequestNotEditableForDetailError,
  ProductNotFoundForDetailError,
  UnitNotFoundForDetailError,
  InvalidPurchaseUnitError,
  InvalidQuantityError,
} from '../../domain/errors.js';

const toPurchaseRequestDetailDTO = (detail) => ({
  _id: detail.id,
  id: detail.id,
  purchaseRequest: detail.purchaseRequest,
  product: detail.product,
  quantity: detail.quantity,
  unit: detail.unit,
  description: detail.description,
  notes: detail.notes,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
});

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

const CREATE_FIELDS = ['purchaseRequest', 'product', 'quantity', 'unit', 'description', 'notes'];
const UPDATE_FIELDS = ['product', 'quantity', 'unit', 'description', 'notes'];

export class PurchaseRequestDetailController {
  constructor({
    listPurchaseRequestDetails,
    getPurchaseRequestDetailById,
    createPurchaseRequestDetail,
    updatePurchaseRequestDetail,
    deletePurchaseRequestDetail,
  }) {
    this.listPurchaseRequestDetailsUseCase = listPurchaseRequestDetails;
    this.getPurchaseRequestDetailByIdUseCase = getPurchaseRequestDetailById;
    this.createPurchaseRequestDetailUseCase = createPurchaseRequestDetail;
    this.updatePurchaseRequestDetailUseCase = updatePurchaseRequestDetail;
    this.deletePurchaseRequestDetailUseCase = deletePurchaseRequestDetail;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidPurchaseRequestDetailIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseRequestDetailNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof PurchaseRequestNotFoundForDetailError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseRequestNotEditableForDetailError) return res.status(400).json({ msj: error.message });
    if (error instanceof ProductNotFoundForDetailError) return res.status(400).json({ msj: error.message });
    if (error instanceof UnitNotFoundForDetailError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidPurchaseUnitError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidQuantityError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { purchaseRequest, page = 1, limit = 50 } = req.query;
      const result = await this.listPurchaseRequestDetailsUseCase.execute({
        companyId: req.user.companyId,
        purchaseRequest,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de lineas vacia' : 'Líneas de solicitud obtenidas correctamente',
        total: result.total,
        data: result.items.map(toPurchaseRequestDetailDTO),
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
      this.#handleError(res, error, 'Error obteniendo líneas de solicitud');
    }
  };

  getOne = async (req, res) => {
    try {
      const detail = await this.getPurchaseRequestDetailByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Línea de solicitud encontrada', data: toPurchaseRequestDetailDTO(detail) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo línea de solicitud');
    }
  };

  create = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, CREATE_FIELDS);
      const detail = await this.createPurchaseRequestDetailUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Línea de solicitud creada exitosamente', newPurchaseRequestDetail: toPurchaseRequestDetailDTO(detail) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando línea de solicitud');
    }
  };

  update = async (req, res) => {
    try {
      const changes = pickDefinedFields(req.body, UPDATE_FIELDS);
      const detail = await this.updatePurchaseRequestDetailUseCase.execute(req.params.id, changes, req.user.companyId);
      res.status(200).json({ msj: 'Línea de solicitud actualizada correctamente', purchaseRequestDetail: toPurchaseRequestDetailDTO(detail) });
    } catch (error) {
      this.#handleError(res, error, 'Error actualizando línea de solicitud');
    }
  };

  delete = async (req, res) => {
    try {
      await this.deletePurchaseRequestDetailUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Línea de solicitud eliminada correctamente' });
    } catch (error) {
      this.#handleError(res, error, 'Error eliminando línea de solicitud');
    }
  };
}
