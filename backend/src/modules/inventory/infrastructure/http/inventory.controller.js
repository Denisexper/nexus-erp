import {
  InvalidInventoryLotIdError,
  InventoryLotNotFoundError,
  InventoryLotNotPlaceableError,
  InvalidAssignQuantityError,
  AssignQuantityExceedsAvailableError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
  VehicleLocationNotValidForPlacementError,
  InvalidAdjustmentQuantityError,
  InsufficientQuantityForAdjustmentError,
  AdjustmentReasonRequiredError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidInventoryLotIdError,
  InventoryLotNotPlaceableError,
  InvalidAssignQuantityError,
  AssignQuantityExceedsAvailableError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
  VehicleLocationNotValidForPlacementError,
  InvalidAdjustmentQuantityError,
  InsufficientQuantityForAdjustmentError,
  AdjustmentReasonRequiredError,
];

const NOT_FOUND_ERRORS = [InventoryLotNotFoundError];

const toMovementDTO = (movement) => ({
  _id: movement.id,
  id: movement.id,
  product: movement.product,
  inventoryLot: movement.inventoryLot,
  warehouse: movement.warehouse,
  location: movement.location,
  movementType: movement.movementType,
  movementDate: movement.movementDate,
  quantityIn: movement.quantityIn,
  quantityOut: movement.quantityOut,
  unitCost: movement.unitCost,
  totalCost: movement.totalCost,
  referenceType: movement.referenceType,
  referenceId: movement.referenceId,
  user: movement.user,
  createdAt: movement.createdAt,
});

const toLotDTO = (lot) => ({
  _id: lot.id,
  id: lot.id,
  company: lot.company,
  lotCode: lot.lotCode,
  product: lot.product,
  purchaseDetail: lot.purchaseDetail,
  receivedAt: lot.receivedAt,
  quantityReceived: lot.quantityReceived,
  quantityAssigned: lot.quantityAssigned,
  unitCost: lot.unitCost,
  totalCost: lot.totalCost,
  status: lot.status,
  createdAt: lot.createdAt,
});

export class InventoryController {
  constructor({
    listInventoryLots,
    getInventoryLotById,
    assignLotToLocation,
    listMovements,
    registerInventoryAdjustment,
    getLotLocationDetails,
    getLocationStockDetail,
  }) {
    this.listInventoryLotsUseCase = listInventoryLots;
    this.getInventoryLotByIdUseCase = getInventoryLotById;
    this.assignLotToLocationUseCase = assignLotToLocation;
    this.listMovementsUseCase = listMovements;
    this.registerInventoryAdjustmentUseCase = registerInventoryAdjustment;
    this.getLotLocationDetailsUseCase = getLotLocationDetails;
    this.getLocationStockDetailUseCase = getLocationStockDetail;
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

  getAllLots = async (req, res) => {
    try {
      const { status, product, page = 1, limit = 10 } = req.query;
      const result = await this.listInventoryLotsUseCase.execute({
        companyId: req.user.companyId,
        status,
        product,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de lotes vacia' : 'Lotes de inventario obtenidos correctamente',
        total: result.total,
        data: result.items.map(toLotDTO),
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
      this.#handleError(res, error, 'Error obteniendo lotes de inventario');
    }
  };

  getOneLot = async (req, res) => {
    try {
      const lot = await this.getInventoryLotByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Lote de inventario encontrado', data: toLotDTO(lot) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo lote de inventario');
    }
  };

  assignLot = async (req, res) => {
    try {
      const { location, quantity } = req.body;
      const lot = await this.assignLotToLocationUseCase.execute(
        { inventoryLot: req.params.id, location, quantity },
        req.user.companyId,
        req.user.id,
      );
      res.status(200).json({ msj: 'Mercancía ubicada correctamente', data: toLotDTO(lot) });
    } catch (error) {
      this.#handleError(res, error, 'Error ubicando el lote de inventario');
    }
  };

  adjustLot = async (req, res) => {
    try {
      const { location, quantity, direction, movementType, reason } = req.body;
      const movement = await this.registerInventoryAdjustmentUseCase.execute(
        { inventoryLot: req.params.id, location, quantity, direction, movementType, reason },
        req.user.companyId,
        req.user.id,
      );
      res.status(201).json({ msj: 'Ajuste registrado correctamente', newInventoryMovement: toMovementDTO(movement) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando el ajuste de inventario');
    }
  };

  getAllMovements = async (req, res) => {
    try {
      const { location, product, inventoryLot, warehouse, movementType, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
      const result = await this.listMovementsUseCase.execute({
        companyId: req.user.companyId,
        location,
        product,
        inventoryLot,
        warehouse,
        movementType,
        dateFrom,
        dateTo,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de movimientos vacia' : 'Movimientos obtenidos correctamente',
        total: result.total,
        data: result.items.map(toMovementDTO),
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
      this.#handleError(res, error, 'Error obteniendo movimientos de inventario');
    }
  };

  getLotLocations = async (req, res) => {
    try {
      const details = await this.getLotLocationDetailsUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({
        msj: details.length === 0 ? 'este lote no tiene existencias en ninguna ubicación' : 'Ubicaciones del lote obtenidas correctamente',
        data: details.map((d) => ({
          location: { _id: d.location?._id, code: d.location?.code, warehouse: d.location?.warehouse },
          quantity: d.quantity,
        })),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo las ubicaciones del lote');
    }
  };

  getLocationStock = async (req, res) => {
    try {
      const details = await this.getLocationStockDetailUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({
        msj: details.length === 0 ? 'esta ubicación no tiene existencias' : 'Existencias de la ubicación obtenidas correctamente',
        data: details.map((d) => ({
          inventoryLot: { _id: d.inventoryLot?._id, lotCode: d.inventoryLot?.lotCode },
          product: d.inventoryLot?.product,
          quantity: d.quantity,
        })),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo las existencias de la ubicación');
    }
  };
}
