import {
  InvalidKardexIdError,
  MovementNotFoundError,
  ProductNotFoundForKardexError,
  LocationNotFoundForKardexError,
  InvalidQuantityError,
  InsufficientStockError,
  SameLocationTransferError,
} from '../../domain/errors.js';
import { MongoLogRepository } from '#modules/logs/infrastructure/persistence/MongoLogRepository.js';
import { WriteLogEntryUseCase } from '#modules/logs/application/use-cases/writeLogEntry.js';

// /transfers responde con dos movimientos (out + in), no con una única
// entidad, así que no encaja en el shape que espera el middleware genérico
// `logAction` (responseKey → una sola entidad). Mismo caso que /locations/batch.
const writeLogEntryUseCase = new WriteLogEntryUseCase(new MongoLogRepository());

const toMovementDTO = (movement) => ({
  _id: movement.id,
  id: movement.id,
  product: movement.product,
  location: movement.location,
  type: movement.type,
  reason: movement.reason,
  quantity: movement.quantity,
  notes: movement.notes,
  transferRef: movement.transferRef,
  createdAt: movement.createdAt,
});

const MOVEMENT_FIELDS = ['product', 'location', 'type', 'reason', 'quantity', 'notes'];
const TRANSFER_FIELDS = ['product', 'fromLocation', 'toLocation', 'quantity', 'notes'];

const pickDefinedFields = (body, keys) =>
  keys.reduce((changes, key) => {
    if (body[key] !== undefined && body[key] !== '') changes[key] = body[key];
    return changes;
  }, {});

export class KardexController {
  constructor({
    listMovements,
    getMovementById,
    registerMovement,
    registerTransfer,
    getStockByLocation,
    getStockByProduct,
  }) {
    this.listMovementsUseCase = listMovements;
    this.getMovementByIdUseCase = getMovementById;
    this.registerMovementUseCase = registerMovement;
    this.registerTransferUseCase = registerTransfer;
    this.getStockByLocationUseCase = getStockByLocation;
    this.getStockByProductUseCase = getStockByProduct;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof InvalidKardexIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof MovementNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof ProductNotFoundForKardexError) return res.status(400).json({ msj: error.message });
    if (error instanceof LocationNotFoundForKardexError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidQuantityError) return res.status(400).json({ msj: error.message });
    if (error instanceof InsufficientStockError) return res.status(400).json({ msj: error.message });
    if (error instanceof SameLocationTransferError) return res.status(400).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const { product, location, type, reason, page = 1, limit = 20 } = req.query;
      const result = await this.listMovementsUseCase.execute({
        companyId: req.user.companyId,
        product,
        location,
        type,
        reason,
        page,
        limit,
      });

      res.status(200).json({
        msj: result.items.length === 0 ? 'lista de movimientos vacia' : 'Movimientos obtenidos correctamente',
        total: result.total,
        data: result.items.map(toMovementDTO),
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
      this.#handleError(res, error, 'Error obteniendo movimientos');
    }
  };

  getOne = async (req, res) => {
    try {
      const movement = await this.getMovementByIdUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Movimiento encontrado', data: toMovementDTO(movement) });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo movimiento');
    }
  };

  createMovement = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, MOVEMENT_FIELDS);
      const movement = await this.registerMovementUseCase.execute(data, req.user.companyId);
      res.status(201).json({ msj: 'Movimiento registrado exitosamente', newMovement: toMovementDTO(movement) });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando movimiento');
    }
  };

  createTransfer = async (req, res) => {
    try {
      const data = pickDefinedFields(req.body, TRANSFER_FIELDS);
      const result = await this.registerTransferUseCase.execute(data, req.user.companyId);

      if (req.user) {
        try {
          await writeLogEntryUseCase.execute({
            user: req.user.id,
            action: 'create',
            resource: 'kardex',
            details: `${req.method} ${req.originalUrl} — transferidas ${result.out.quantity} unidades de producto ${data.product} entre ubicaciones`,
            userAgent: req.get('user-agent'),
            statusCode: 201,
          });
        } catch (logError) {
          console.error('Error creating log:', logError);
        }
      }

      res.status(201).json({
        msj: 'Transferencia registrada exitosamente',
        out: toMovementDTO(result.out),
        in: toMovementDTO(result.in),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error registrando transferencia');
    }
  };

  getStockByLocation = async (req, res) => {
    try {
      const stock = await this.getStockByLocationUseCase.execute(req.params.locationId, req.user.companyId);
      res.status(200).json({ msj: 'Existencias obtenidas correctamente', data: stock });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo existencias de la ubicación');
    }
  };

  getStockByProduct = async (req, res) => {
    try {
      const stock = await this.getStockByProductUseCase.execute(req.params.productId, req.user.companyId);
      res.status(200).json({ msj: 'Existencias obtenidas correctamente', data: stock });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo existencias del producto');
    }
  };
}
