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

  // Suma, por cada PurchaseRequestDetail dado, la cantidad ya cotizada
  // (de cualquier estado, incluida esta recién creada) — {detailId: cantidad}.
  // Usado para avanzar el status de la solicitud de origen según cuánta
  // cantidad de cada línea quedó realmente cubierta, no solo si fue tocada.
  async sumQuotedQuantitiesByRequestDetailIds(_purchaseRequestDetailIds) {
    throw new Error('PurchaseQuotationRepository.sumQuotedQuantitiesByRequestDetailIds no implementado');
  }

  // Cotizaciones (no canceladas) que cubren alguna de las líneas de
  // solicitud dadas, con sus líneas de detalle filtradas a las que aplican —
  // insumo de la pantalla de comparación. El join con purchase-requests se
  // resuelve en el use-case (mismo criterio que warehouse/location con
  // branch): esta consulta solo toca las colecciones propias del módulo.
  async findComparisonForRequestDetailIds(_purchaseRequestDetailIds, _companyId) {
    throw new Error('PurchaseQuotationRepository.findComparisonForRequestDetailIds no implementado');
  }

  // ids de PurchaseRequest vinculados a esta cotización vía la tabla puente
  // purchase_quotation_requests. Usado por purchase-orders para saber a qué
  // solicitudes avanzar el status al generar una orden desde esta cotización.
  async findRequestIdsForQuotation(_quotationId) {
    throw new Error('PurchaseQuotationRepository.findRequestIdsForQuotation no implementado');
  }

  // Suma, por cada línea de solicitud dada, la cantidad ya "comprada": la
  // trazada hacia líneas de cotización cuya cotización está en status
  // 'selected' (o sea, ya se generó una orden a partir de ella) — {detailId:
  // cantidad}. Usado por purchase-orders para avanzar la solicitud a
  // partially_ordered/completed según cantidad real, no solo línea tocada.
  async sumOrderedQuantitiesByRequestDetailIds(_purchaseRequestDetailIds) {
    throw new Error('PurchaseQuotationRepository.sumOrderedQuantitiesByRequestDetailIds no implementado');
  }
}
