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

  // Busca un gasto por su id, validando que la orden a la que pertenece sea
  // de la company indicada (o sin filtrar si companyId es undefined). Usado
  // por purchase-order-expense-documents para validar tenencia antes de
  // subir/listar/borrar evidencias, sin duplicar ese conocimiento ahí.
  async findExpenseById(_expenseId, _companyId) {
    throw new Error('PurchaseOrderRepository.findExpenseById no implementado');
  }
}
