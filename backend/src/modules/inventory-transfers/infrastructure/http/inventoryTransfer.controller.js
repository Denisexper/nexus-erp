import {
  InvalidInventoryTransferIdError,
  InventoryTransferNotFoundError,
  SourceWarehouseNotFoundError,
  DestinationWarehouseNotFoundError,
  EmptyTransferError,
  InventoryLotNotFoundForTransferError,
  VehicleLocationRequiredError,
  InvalidVehicleLocationError,
  SourceLocationNotFoundError,
  DestinationLocationNotFoundError,
  DestinationLocationCannotBeVehicleError,
  InvalidTransferQuantityError,
  InsufficientQuantityAtSourceError,
  InvalidTransferStatusTransitionError,
  InvalidReceivedQuantityError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidInventoryTransferIdError,
  SourceWarehouseNotFoundError,
  DestinationWarehouseNotFoundError,
  EmptyTransferError,
  InventoryLotNotFoundForTransferError,
  VehicleLocationRequiredError,
  InvalidVehicleLocationError,
  SourceLocationNotFoundError,
  DestinationLocationNotFoundError,
  DestinationLocationCannotBeVehicleError,
  InvalidTransferQuantityError,
  InsufficientQuantityAtSourceError,
  InvalidTransferStatusTransitionError,
  InvalidReceivedQuantityError,
];

const NOT_FOUND_ERRORS = [InventoryTransferNotFoundError];

const toDetailDTO = (detail) => ({
  _id: detail.id,
  id: detail.id,
  inventoryLot: detail.inventoryLot,
  product: detail.product,
  sourceLocation: detail.sourceLocation,
  destinationLocation: detail.destinationLocation,
  quantityDispatched: detail.quantityDispatched,
  quantityReceived: detail.quantityReceived,
  unitCost: detail.unitCost,
  notes: detail.notes,
});

const toTransferDTO = (transfer) => ({
  _id: transfer.id,
  id: transfer.id,
  company: transfer.company,
  transferCode: transfer.transferCode,
  sourceWarehouse: transfer.sourceWarehouse,
  destinationWarehouse: transfer.destinationWarehouse,
  vehicleLocation: transfer.vehicleLocation,
  transferDate: transfer.transferDate,
  dispatchedAt: transfer.dispatchedAt,
  receivedAt: transfer.receivedAt,
  status: transfer.status,
  user: transfer.user,
  notes: transfer.notes,
  details: (transfer.details || []).map(toDetailDTO),
  createdAt: transfer.createdAt,
});

export class InventoryTransferController {
  constructor({ createTransfer, dispatchTransfer, receiveTransfer, reportIncident, resolveIncident, listTransfers, getTransferById }) {
    this.createTransferUseCase = createTransfer;
    this.dispatchTransferUseCase = dispatchTransfer;
    this.receiveTransferUseCase = receiveTransfer;
    this.reportIncidentUseCase = reportIncident;
    this.resolveIncidentUseCase = resolveIncident;
    this.listTransfersUseCase = listTransfers;
    this.getTransferByIdUseCase = getTransferById;
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
      const { status, page = 1, limit = 10 } = req.query;
      const result = await this.listTransfersUseCase.execute({ companyId: req.user.companyId, status, page, limit });
      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de traslados vacia' : 'Traslados obtenidos correctamente',
        total: result.total,
        data: result.items.map(toTransferDTO),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(result.total / limit) || 1,
          totalRecords: result.total,
          limit: Number(limit),
          hasNextPage: page * limit < result.total,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo traslados');
    }
  };

  getOne = async (req, res) => {
    try {
      const transfer = await this.getTransferByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Traslado encontrado', data: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo el traslado');
    }
  };

  create = async (req, res) => {
    try {
      const { sourceWarehouse, destinationWarehouse, vehicleLocation, transferDate, notes, lines } = req.body;
      const transfer = await this.createTransferUseCase.execute(
        { sourceWarehouse, destinationWarehouse, vehicleLocation, transferDate, notes, lines },
        req.user.companyId,
        req.user.id,
      );
      res.status(201).json({ msj: 'Traslado creado exitosamente', newInventoryTransfer: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error creando el traslado');
    }
  };

  dispatch = async (req, res) => {
    try {
      const transfer = await this.dispatchTransferUseCase.execute(req.params.id, req.user.companyId, req.user.id);
      res.status(200).json({ msj: 'Traslado despachado correctamente', inventoryTransfer: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error despachando el traslado');
    }
  };

  receive = async (req, res) => {
    try {
      const { receipts } = req.body;
      const transfer = await this.receiveTransferUseCase.execute(req.params.id, { receipts }, req.user.companyId, req.user.id);
      res.status(200).json({ msj: 'Traslado recibido correctamente', inventoryTransfer: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error recibiendo el traslado');
    }
  };

  reportIncident = async (req, res) => {
    try {
      const { notes } = req.body;
      const transfer = await this.reportIncidentUseCase.execute(req.params.id, { notes }, req.user.companyId);
      res.status(200).json({ msj: 'Incidencia registrada correctamente', inventoryTransfer: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando la incidencia');
    }
  };

  resolveIncident = async (req, res) => {
    try {
      const { action, notes } = req.body;
      const transfer = await this.resolveIncidentUseCase.execute(req.params.id, { action, notes }, req.user.companyId, req.user.id);
      res.status(200).json({ msj: 'Incidencia resuelta correctamente', inventoryTransfer: toTransferDTO(transfer) });
    } catch (error) {
      this.#handleError(res, error, 'Error resolviendo la incidencia');
    }
  };
}
