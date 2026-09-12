export class RetaceoRepository {
  async findAll(_criteria) {
    throw new Error('RetaceoRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('RetaceoRepository.findById no implementado');
  }

  async findByPurchaseOrder(_purchaseOrderId, _companyId) {
    throw new Error('RetaceoRepository.findByPurchaseOrder no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('RetaceoRepository.getNextCode no implementado');
  }

  // Crea el retaceo completo (cabecera + detalle, ya calculados) en una sola
  // operación, mismo criterio que purchase-quotations.create y
  // purchase-orders.create: escrituras secuenciales, sin transacción.
  async create(_retaceoData) {
    throw new Error('RetaceoRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('RetaceoRepository.update no implementado');
  }
}
