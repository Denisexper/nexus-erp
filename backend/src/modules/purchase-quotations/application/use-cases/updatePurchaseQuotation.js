import {
  PurchaseQuotationNotFoundError,
  PurchaseQuotationNotEditableError,
} from '../../domain/errors.js';

// Solo campos informativos de la cabecera; las líneas/gastos/precios no se
// editan una vez creada la cotización (si están mal, se rechaza/cancela y
// se registra una nueva), decisión que evita rehacer todas las validaciones
// de trazabilidad y recálculo de totales sobre una cotización ya existente.
export class UpdatePurchaseQuotationUseCase {
  constructor(purchaseQuotationRepository) {
    this.purchaseQuotationRepository = purchaseQuotationRepository;
  }

  async execute(id, changes, companyId) {
    const purchaseQuotation = await this.purchaseQuotationRepository.findById(id, companyId);
    if (!purchaseQuotation) throw new PurchaseQuotationNotFoundError();

    if (purchaseQuotation.status !== 'received') throw new PurchaseQuotationNotEditableError();

    return this.purchaseQuotationRepository.update(id, changes);
  }
}
