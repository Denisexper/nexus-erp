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

  // Saldo actual de un lote específico en una ubicación específica — usado
  // por inventory-transfers para validar disponibilidad antes de despachar.
  async getLotQuantityAtLocation(_lotId, _locationId) {
    throw new Error('InventoryRepository.getLotQuantityAtLocation no implementado');
  }

  // Desglose de en qué ubicaciones (con cantidad > 0) está un lote —
  // reemplaza, para el formulario de traslados, la lista de "todas las
  // ubicaciones del almacén" por "solo donde este lote realmente tiene algo".
  async findLocationDetailsByLot(_lotId) {
    throw new Error('InventoryRepository.findLocationDetailsByLot no implementado');
  }

  // Desglose de qué lotes (con cantidad > 0) hay en una ubicación — para el
  // detalle de Ubicaciones, que hoy no muestra contenido.
  async findLotDetailsByLocation(_locationId) {
    throw new Error('InventoryRepository.findLotDetailsByLocation no implementado');
  }

  // Operación atómica (transacción Mongo) reusada por inventory-transfers
  // para cada "pata" de un traslado (origen->vehículo al despachar,
  // vehículo->destino al recibir): escribe una salida en fromLocation
  // (fromWarehouse) y una entrada en toLocation (toWarehouse) — se piden
  // ambos almacenes por separado porque fromLocation/toLocation casi
  // siempre pertenecen a almacenes distintos. Ambos movimientos quedan
  // como movementType 'transfer'. A diferencia de assignLotToLocation,
  // NUNCA toca inventory_cost_averages (RN-INV-015). Devuelve los dos
  // InventoryMovement creados.
  async recordTransferLeg(_data) {
    throw new Error('InventoryRepository.recordTransferLeg no implementado');
  }

  // Ajuste de una sola ubicación (ej. merma detectada al recibir un traslado
  // con menos cantidad de la despachada): un movimiento 'adjustment' de
  // salida + resta del saldo en esa ubicación. Tampoco toca el costo
  // promedio (la pérdida física no cambia el costo unitario del resto).
  async recordInventoryAdjustment(_data) {
    throw new Error('InventoryRepository.recordInventoryAdjustment no implementado');
  }

  // Consulta de movimientos (ERS 6.9.16, "Kardex y consultas"): por
  // producto, lote, almacén, ubicación o rango de fechas. Reemplaza al
  // kardex viejo — ahora es solo una vista de solo lectura sobre
  // inventory_movements, no una pantalla de carga manual.
  async findMovements(_criteria) {
    throw new Error('InventoryRepository.findMovements no implementado');
  }

  // Ajuste manual valorizado (Fase 5, RN-INV-012 devoluciones / ajustes
  // generales): a diferencia de recordInventoryAdjustment (usado
  // internamente por traslados, que NUNCA toca el costo promedio), este SÍ
  // actualiza inventory_cost_averages — es una pérdida o ganancia real de
  // inventario declarada por una persona (conteo físico, daño, devolución
  // aceptada), no un movimiento interno de traslado. 'increase' usa
  // lot.unitCost (vuelve al mismo lote); 'decrease' valora la salida al
  // costo promedio vigente de la empresa+producto, no al costo del lote.
  async recordValuedAdjustment(_data) {
    throw new Error('InventoryRepository.recordValuedAdjustment no implementado');
  }
}
