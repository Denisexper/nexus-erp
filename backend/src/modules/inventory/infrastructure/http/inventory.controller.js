import {
  InvalidInventoryLotIdError,
  InventoryLotNotFoundError,
  InventoryLotNotPlaceableError,
  InvalidAssignQuantityError,
  AssignQuantityExceedsAvailableError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
  VehicleLocationNotValidForPlacementError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [
  InvalidInventoryLotIdError,
  InventoryLotNotPlaceableError,
  InvalidAssignQuantityError,
  AssignQuantityExceedsAvailableError,
  LocationNotFoundForInventoryError,
  InactiveLocationForInventoryError,
  VehicleLocationNotValidForPlacementError,
];

const NOT_FOUND_ERRORS = [InventoryLotNotFoundError];

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
  constructor({ listInventoryLots, getInventoryLotById, assignLotToLocation }) {
    this.listInventoryLotsUseCase = listInventoryLots;
    this.getInventoryLotByIdUseCase = getInventoryLotById;
    this.assignLotToLocationUseCase = assignLotToLocation;
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
}
