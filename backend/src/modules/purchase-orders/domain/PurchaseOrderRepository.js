export class PurchaseOrderRepository {
  async findAll(_criteria) {
    throw new Error('PurchaseOrderRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('PurchaseOrderRepository.findById no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('PurchaseOrderRepository.getNextCode no implementado');
  }

  // Crea la orden completa (cabecera + líneas + gastos, copiados de la
  // cotización seleccionada) en una sola operación, mismo criterio que
  // purchase-quotations.create: escrituras secuenciales, sin transacción.
  async create(_orderData) {
    throw new Error('PurchaseOrderRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('PurchaseOrderRepository.update no implementado');
  }

  async addExpense(_id, _expense) {
    throw new Error('PurchaseOrderRepository.addExpense no implementado');
  }
}
