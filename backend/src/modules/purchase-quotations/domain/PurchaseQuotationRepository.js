export class PurchaseQuotationRepository {
  async findAll(_criteria) {
    throw new Error('PurchaseQuotationRepository.findAll no implementado');
  }

  async findById(_id, _companyId) {
    throw new Error('PurchaseQuotationRepository.findById no implementado');
  }

  async findIdsByCompany(_companyId) {
    throw new Error('PurchaseQuotationRepository.findIdsByCompany no implementado');
  }

  async getNextCode(_companyId) {
    throw new Error('PurchaseQuotationRepository.getNextCode no implementado');
  }

  // Crea la cotización completa (cabecera + líneas + gastos + tablas puente
  // de vínculo/trazabilidad con las solicitudes de origen) en una sola
  // operación, igual criterio que kardex.createMany para transferencias:
  // escrituras secuenciales, sin transacción (el resto de la app tampoco usa).
  async create(_quotationData) {
    throw new Error('PurchaseQuotationRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('PurchaseQuotationRepository.update no implementado');
  }

  // ids de PurchaseRequestDetail que ya tienen al menos un vínculo de
  // trazabilidad hacia alguna cotización (de cualquier estado, incluida esta
  // recién creada). Usado para avanzar el status de la solicitud de origen.
  async findCoveredRequestDetailIds(_purchaseRequestDetailIds) {
    throw new Error('PurchaseQuotationRepository.findCoveredRequestDetailIds no implementado');
  }

  // Cotizaciones (no canceladas) que cubren alguna de las líneas de
  // solicitud dadas, con sus líneas de detalle filtradas a las que aplican —
  // insumo de la pantalla de comparación. El join con purchase-requests se
  // resuelve en el use-case (mismo criterio que warehouse/location con
  // branch): esta consulta solo toca las colecciones propias del módulo.
  async findComparisonForRequestDetailIds(_purchaseRequestDetailIds, _companyId) {
    throw new Error('PurchaseQuotationRepository.findComparisonForRequestDetailIds no implementado');
  }
}
