import { InventoryLotNotFoundError } from '../../domain/errors.js';

// Para el formulario de traslados: en qué ubicaciones (con cantidad > 0)
// está realmente un lote, en vez de listar todas las ubicaciones del
// almacén sin filtrar.
export class GetLotLocationDetailsUseCase {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async execute(lotId, companyId) {
    const lot = await this.inventoryRepository.findLotById(lotId, companyId);
    if (!lot) throw new InventoryLotNotFoundError();
    return this.inventoryRepository.findLocationDetailsByLot(lotId);
  }
}
