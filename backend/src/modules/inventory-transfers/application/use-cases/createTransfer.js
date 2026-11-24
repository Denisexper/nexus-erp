import { InventoryTransfer } from '../../domain/InventoryTransfer.js';
import { InventoryTransferDetail } from '../../domain/InventoryTransferDetail.js';
import {
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
} from '../../domain/errors.js';
import { resolveBranchIdsForCompany, resolveWarehouseIdsForCompany } from '#shared/lib/tenantScope.js';

// ERS 6.9.13/6.9.19: solo planifica (cabecera + líneas), todavía no mueve
// stock — eso pasa al despachar (dispatchTransfer). La ubicación tipo
// vehículo se exige siempre en esta fase: no se implementa el atajo de
// traslado directo entre ubicaciones de un mismo almacén sin pasar por un
// vehículo (queda fuera de alcance de esta entrega).
export class CreateTransferUseCase {
  constructor(inventoryTransferRepository, inventoryRepository, warehouseRepository, locationRepository, branchRepository) {
    this.inventoryTransferRepository = inventoryTransferRepository;
    this.inventoryRepository = inventoryRepository;
    this.warehouseRepository = warehouseRepository;
    this.locationRepository = locationRepository;
    this.branchRepository = branchRepository;
  }

  async execute({ sourceWarehouse, destinationWarehouse, vehicleLocation, transferDate, notes, lines = [] }, company, user) {
    const branchIds = await resolveBranchIdsForCompany(company, this.branchRepository);

    const sourceWarehouseDoc = await this.warehouseRepository.findById(sourceWarehouse, branchIds);
    if (!sourceWarehouseDoc) throw new SourceWarehouseNotFoundError();

    const destinationWarehouseDoc = await this.warehouseRepository.findById(destinationWarehouse, branchIds);
    if (!destinationWarehouseDoc) throw new DestinationWarehouseNotFoundError();

    if (!vehicleLocation) throw new VehicleLocationRequiredError();
    // Las ubicaciones tipo vehículo son un activo de la empresa, no de un
    // almacén puntual (ver nota en el plan): se valida contra cualquier
    // almacén de la company, no solo el de origen.
    const warehouseIds = await resolveWarehouseIdsForCompany(company, this.branchRepository, this.warehouseRepository);
    const vehicleLocationDoc = await this.locationRepository.findById(vehicleLocation, warehouseIds);
    if (!vehicleLocationDoc || vehicleLocationDoc.type !== 'vehicle') throw new InvalidVehicleLocationError();

    if (!lines.length) throw new EmptyTransferError();

    const details = [];
    for (const line of lines) {
      const lot = await this.inventoryRepository.findLotById(line.inventoryLot, company);
      if (!lot) throw new InventoryLotNotFoundForTransferError();

      const sourceLocationDoc = await this.locationRepository.findById(line.sourceLocation, [sourceWarehouse]);
      if (!sourceLocationDoc) throw new SourceLocationNotFoundError();

      const destinationLocationDoc = await this.locationRepository.findById(line.destinationLocation, [destinationWarehouse]);
      if (!destinationLocationDoc) throw new DestinationLocationNotFoundError();
      if (destinationLocationDoc.type === 'vehicle') throw new DestinationLocationCannotBeVehicleError();

      const quantity = Number(line.quantityDispatched);
      if (!(quantity > 0)) throw new InvalidTransferQuantityError();

      const available = await this.inventoryRepository.getLotQuantityAtLocation(line.inventoryLot, line.sourceLocation);
      if (quantity > available + 0.0001) throw new InsufficientQuantityAtSourceError();

      details.push(
        new InventoryTransferDetail({
          inventoryLot: lot.id,
          product: lot.product?._id || lot.product,
          sourceLocation: line.sourceLocation,
          destinationLocation: line.destinationLocation,
          quantityDispatched: quantity,
          unitCost: lot.unitCost,
          notes: line.notes,
        }),
      );
    }

    const transferCode = await this.inventoryTransferRepository.getNextCode(company);

    const transfer = new InventoryTransfer({
      company,
      transferCode,
      sourceWarehouse,
      destinationWarehouse,
      vehicleLocation,
      transferDate: transferDate || new Date(),
      status: 'preparing',
      user,
      notes,
    });

    return this.inventoryTransferRepository.create({ transfer, lines: details });
  }
}
