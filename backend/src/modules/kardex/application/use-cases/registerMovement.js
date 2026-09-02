import { KardexMovement } from '../../domain/KardexMovement.js';
import { resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';
import {
  ProductNotFoundForKardexError,
  LocationNotFoundForKardexError,
  InvalidQuantityError,
  InsufficientStockError,
} from '../../domain/errors.js';

// RN-KDX: registra una entrada, salida o ajuste de un producto en una
// ubicación puntual. El kardex es un libro contable: nunca se edita ni se
// borra un movimiento, solo se agregan nuevos (una salida errónea se corrige
// con otro movimiento, no editando el original).
export class RegisterMovementUseCase {
  constructor(kardexRepository, productRepository, locationRepository, branchRepository, warehouseRepository) {
    this.kardexRepository = kardexRepository;
    this.productRepository = productRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
    this.warehouseRepository = warehouseRepository;
  }

  async execute(data, companyId) {
    if (!(Number(data.quantity) > 0)) throw new InvalidQuantityError();

    const product = await this.productRepository.findById(data.product, companyId);
    if (!product) throw new ProductNotFoundForKardexError();

    // La ubicación tiene que ser de la company del usuario (si no, cualquiera
    // con permiso de registrar movimientos podría mover stock ajeno).
    const warehouseIds = await resolveWarehouseIdsForCompany(companyId, this.branchRepository, this.warehouseRepository);
    const location = await this.locationRepository.findById(data.location, warehouseIds);
    if (!location) throw new LocationNotFoundForKardexError();

    if (data.type === 'out') {
      const currentStock = await this.kardexRepository.getStockByProductAndLocation(data.product, data.location);
      if (currentStock < Number(data.quantity)) throw new InsufficientStockError();
    }

    const movement = new KardexMovement({
      product: data.product,
      location: data.location,
      type: data.type,
      reason: data.reason,
      quantity: Number(data.quantity),
      notes: data.notes,
    });

    return this.kardexRepository.create(movement);
  }
}
