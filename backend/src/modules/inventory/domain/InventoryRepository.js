export class InventoryRepository {
  async findLots(_criteria) {
    throw new Error('InventoryRepository.findLots no implementado');
  }

  async findLotById(_id, _companyId) {
    throw new Error('InventoryRepository.findLotById no implementado');
  }

  async getNextLotCode(_companyId) {
    throw new Error('InventoryRepository.getNextLotCode no implementado');
  }

  // Crea un lote por cada PurchaseDetail recién recibido (createPurchase.js).
  async createLotsFromPurchase(_lots) {
    throw new Error('InventoryRepository.createLotsFromPurchase no implementado');
  }

  // Lotes originados en los PurchaseDetail dados, de cualquier estado —
  // usado por createRetaceo.js para localizar qué lotes corregir.
  async findLotsByPurchaseDetailIds(_purchaseDetailIds, _companyId) {
    throw new Error('InventoryRepository.findLotsByPurchaseDetailIds no implementado');
  }

  // Corrección de costo pre-ubicación (retaceo). Solo se invoca sobre lotes
  // todavía 'pending_placement': no genera movimiento ni toca el costo
  // promedio, porque ninguno existe todavía para este lote.
  async updateLotCost(_lotId, _changes) {
    throw new Error('InventoryRepository.updateLotCost no implementado');
  }

  // Operación atómica (transacción Mongo): escribe el InventoryMovement de
  // entrada, el saldo por ubicación, el costo promedio global de la empresa
  // y actualiza quantityAssigned/status del lote, las 4 juntas o ninguna
  // (ERS 6.9.19). Devuelve el lote actualizado.
  async assignLotToLocation(_data) {
    throw new Error('InventoryRepository.assignLotToLocation no implementado');
  }

  // Suma de existencias de todos los lotes en una ubicación — reemplaza
  // kardexRepository.getTotalStockByLocation para el guard de desactivación
  // de almacenes/ubicaciones.
  async getLocationStock(_locationId) {
    throw new Error('InventoryRepository.getLocationStock no implementado');
  }
}
