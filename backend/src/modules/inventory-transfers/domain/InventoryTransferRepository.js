export class InventoryTransferRepository {
  async findAll(_criteria) {
    throw new Error('InventoryTransferRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('InventoryTransferRepository.findById no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('InventoryTransferRepository.getNextCode no implementado');
  }

  // Crea cabecera + líneas en una sola operación (igual criterio que
  // purchase-quotations: sin transacción, es solo planificación, todavía no
  // mueve stock).
  async create(_data) {
    throw new Error('InventoryTransferRepository.create no implementado');
  }

  async updateStatus(_id, _changes) {
    throw new Error('InventoryTransferRepository.updateStatus no implementado');
  }

  // Marca la cantidad realmente recibida de una línea (puede ser menor a la
  // despachada).
  async updateDetailReceived(_detailId, _quantityReceived) {
    throw new Error('InventoryTransferRepository.updateDetailReceived no implementado');
  }
}
