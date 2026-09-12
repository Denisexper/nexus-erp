// Solo 'registered' y 'cancelled' son alcanzables por endpoint en esta etapa:
// el retaceo se registra completo en un solo paso (cabecera + detalle ya
// calculados), sin flujo de aprobación intermedio, mismo criterio que
// purchase-quotations al nacer en 'received'.
export const RETACEO_STATUSES = ['registered', 'cancelled'];

export class Retaceo {
  constructor({
    id,
    company,
    code,
    purchaseOrder,
    supplier,
    retaceoDate,
    originCountry,
    importInvoiceNumber,
    importInvoiceDate,
    importPolicyNumber,
    importPolicyDate,
    totalFob = 0,
    totalFreight = 0,
    totalExpenses = 0,
    totalDai = 0,
    totalCost = 0,
    status = 'registered',
    notes,
    user,
    details = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company
    this.code = code; // ej: RTC-00001, único por company
    this.purchaseOrder = purchaseOrder; // id de PurchaseOrder de origen (debe estar 'approved')
    this.supplier = supplier; // id de Supplier, denormalizado de la orden de origen
    this.retaceoDate = retaceoDate;
    this.originCountry = originCountry;
    this.importInvoiceNumber = importInvoiceNumber;
    this.importInvoiceDate = importInvoiceDate;
    this.importPolicyNumber = importPolicyNumber;
    this.importPolicyDate = importPolicyDate;
    this.totalFob = totalFob; // SUM(detail.costFob)
    this.totalFreight = totalFreight; // gasto de flete a distribuir
    this.totalExpenses = totalExpenses; // resto de gastos a distribuir (SUM de expense-types distintos de flete/DAI)
    this.totalDai = totalDai; // derechos arancelarios de importación a distribuir
    this.totalCost = totalCost; // totalFob + totalFreight + totalExpenses + totalDai
    this.status = status;
    this.notes = notes;
    this.user = user; // id de User que registra el retaceo
    this.details = details; // RetaceoDetail[]
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
