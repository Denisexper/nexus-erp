import { randomUUID } from 'node:crypto';
import { KardexMovement } from '../../domain/KardexMovement.js';
import {
  ProductNotFoundForKardexError,
  LocationNotFoundForKardexError,
  InvalidQuantityError,
  InsufficientStockError,
  SameLocationTransferError,
} from '../../domain/errors.js';

// Una transferencia es, en el kardex, un par de movimientos ligados por
// transferRef: una salida en el origen y una entrada en el destino. No existe
// un tipo 'transfer' aparte: así el cálculo de stock (suma de in/out) no
// necesita saber nada de transferencias.
export class RegisterTransferUseCase {
  constructor(kardexRepository, productRepository, locationRepository) {
    this.kardexRepository = kardexRepository;
    this.productRepository = productRepository;
    this.locationRepository = locationRepository;
  }

  async execute(data) {
    if (!(Number(data.quantity) > 0)) throw new InvalidQuantityError();
    if (data.fromLocation === data.toLocation) throw new SameLocationTransferError();

    const product = await this.productRepository.findById(data.product);
    if (!product) throw new ProductNotFoundForKardexError();

    const fromLocation = await this.locationRepository.findById(data.fromLocation);
    if (!fromLocation) throw new LocationNotFoundForKardexError();

    const toLocation = await this.locationRepository.findById(data.toLocation);
    if (!toLocation) throw new LocationNotFoundForKardexError();

    const currentStock = await this.kardexRepository.getStockByProductAndLocation(data.product, data.fromLocation);
    if (currentStock < Number(data.quantity)) throw new InsufficientStockError();

    const transferRef = randomUUID();
    const quantity = Number(data.quantity);

    const [outMovement, inMovement] = await this.kardexRepository.createMany([
      new KardexMovement({
        product: data.product,
        location: data.fromLocation,
        type: 'out',
        reason: 'transfer',
        quantity,
        notes: data.notes,
        transferRef,
      }),
      new KardexMovement({
        product: data.product,
        location: data.toLocation,
        type: 'in',
        reason: 'transfer',
        quantity,
        notes: data.notes,
        transferRef,
      }),
    ]);

    return { out: outMovement, in: inMovement };
  }
}
