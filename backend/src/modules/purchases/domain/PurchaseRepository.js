export class PurchaseRepository {
  async findAll(_criteria) {
    throw new Error('PurchaseRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('PurchaseRepository.findById no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('PurchaseRepository.getNextCode no implementado');
  }

  // Cantidad ya recibida por cada purchase_order_detail, sumando todas las
  // compras no canceladas registradas contra esa orden. Usado para validar
  // que una nueva recepción no exceda lo pendiente (RN-008) y para recalcular
  // el estado de la orden (partially_received / received).
  async getReceivedQuantitiesByOrder(_purchaseOrderId) {
    throw new Error('PurchaseRepository.getReceivedQuantitiesByOrder no implementado');
  }

  // Crea la compra completa (cabecera + detalle) en una sola operación,
  // mismo criterio que purchase-orders.create: escrituras secuenciales, sin
  // transacción.
  async create(_purchaseData) {
    throw new Error('PurchaseRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('PurchaseRepository.update no implementado');
  }
}
