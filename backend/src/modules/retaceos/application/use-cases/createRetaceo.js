import { Retaceo } from '../../domain/Retaceo.js';
import { RetaceoDetail } from '../../domain/RetaceoDetail.js';
import {
  PurchaseOrderNotFoundForRetaceoError,
  PurchaseOrderNotRetaceableError,
  PurchaseOrderAlreadyRetaceadoError,
  InvalidDaiAmountError,
  InvalidFreightAmountError,
} from '../../domain/errors.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// RN-011/RN-012 del ERS: los gastos adicionales de una importación se
// distribuyen proporcionalmente entre los productos según su participación
// en el FOB total, y el costo final de cada producto se recalcula con esa
// distribución.
//
// Flete y DAI se capturan aquí (no se leen del catálogo de expense-types de
// la orden) porque en la práctica solo se conocen al momento del despacho
// aduanal, después de que la orden ya fue aprobada. "Gastos" sí toma
// additionalExpenses de la orden, que es la suma de lo ya registrado vía
// purchase_order_expenses (RN-COM y CU-086).
export class CreateRetaceoUseCase {
  constructor(retaceoRepository, purchaseOrderRepository) {
    this.retaceoRepository = retaceoRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(
    {
      purchaseOrder,
      retaceoDate,
      originCountry,
      importInvoiceNumber,
      importInvoiceDate,
      importPolicyNumber,
      importPolicyDate,
      totalFreight = 0,
      totalDai = 0,
      notes,
    },
    company,
    user,
  ) {
    const order = await this.purchaseOrderRepository.findById(purchaseOrder, company);
    if (!order) throw new PurchaseOrderNotFoundForRetaceoError();
    if (order.status !== 'approved') throw new PurchaseOrderNotRetaceableError();

    const existing = await this.retaceoRepository.findByPurchaseOrder(purchaseOrder, company);
    if (existing) throw new PurchaseOrderAlreadyRetaceadoError();

    if (Number(totalFreight) < 0) throw new InvalidFreightAmountError();
    if (Number(totalDai) < 0) throw new InvalidDaiAmountError();

    const totalFob = order.subtotal;
    const freight = round2(totalFreight);
    const dai = round2(totalDai);
    const expenses = round2(order.additionalExpenses);

    const lines = order.details.map((detail) => ({
      product: detail.product?._id || detail.product,
      quantity: detail.quantity,
      costFob: detail.subtotal,
      ratio: detail.subtotal / totalFob,
    }));

    // La última línea absorbe el residuo de redondeo para que el detalle
    // cuadre exacto contra los totales de cabecera (mismo criterio que
    // cualquier reparto de centavos en un documento financiero).
    let freightAssigned = 0;
    let expensesAssigned = 0;
    let daiAssigned = 0;

    const details = lines.map((line, index) => {
      const isLast = index === lines.length - 1;

      const freightAmount = isLast ? round2(freight - freightAssigned) : round2(line.ratio * freight);
      const expenseAmount = isLast ? round2(expenses - expensesAssigned) : round2(line.ratio * expenses);
      const daiAmount = isLast ? round2(dai - daiAssigned) : round2(line.ratio * dai);

      freightAssigned = round2(freightAssigned + freightAmount);
      expensesAssigned = round2(expensesAssigned + expenseAmount);
      daiAssigned = round2(daiAssigned + daiAmount);

      const totalCost = round2(line.costFob + freightAmount + expenseAmount + daiAmount);
      const unitCost = round2(totalCost / line.quantity);

      return new RetaceoDetail({
        product: line.product,
        quantity: line.quantity,
        costFob: line.costFob,
        freightAmount,
        expenseAmount,
        daiAmount,
        unitCost,
        totalCost,
      });
    });

    const totalCost = round2(totalFob + freight + expenses + dai);
    const code = await this.retaceoRepository.getNextCode(company);

    const retaceo = new Retaceo({
      company,
      code,
      purchaseOrder: order.id,
      supplier: order.supplier?._id || order.supplier,
      retaceoDate: retaceoDate || new Date(),
      originCountry,
      importInvoiceNumber,
      importInvoiceDate,
      importPolicyNumber,
      importPolicyDate,
      totalFob,
      totalFreight: freight,
      totalExpenses: expenses,
      totalDai: dai,
      totalCost,
      notes,
      user,
      status: 'registered',
    });

    return this.retaceoRepository.create({ retaceo, details });
  }
}
