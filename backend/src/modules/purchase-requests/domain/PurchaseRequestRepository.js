export class PurchaseRequestRepository {
  async findAll(_criteria) {
    throw new Error('PurchaseRequestRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('PurchaseRequestRepository.findById no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('PurchaseRequestRepository.findIdsByCompany no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('PurchaseRequestRepository.getNextCode no implementado');
  }

  async create(_purchaseRequest) {
    throw new Error('PurchaseRequestRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('PurchaseRequestRepository.update no implementado');
  }
}
