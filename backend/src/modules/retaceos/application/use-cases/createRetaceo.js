import { Retaceo } from '../../domain/Retaceo.js';
import { RetaceoDetail } from '../../domain/RetaceoDetail.js';
import {
  PurchaseNotFoundForRetaceoError,
  PurchaseNotRetaceableError,
  PurchaseAlreadyRetaceadoError,
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
// aduanal. "Gastos" toma los purchase_order_expenses de la orden de origen
// (RN-COM y CU-086), filtrados por isCostable: un gasto marcado como no
// costeable (ej. un gasto puramente administrativo) queda fuera del
// prorrateo (ERS v0.9, diagrama Eraser de Denis).
//
// El retaceo ahora se ancla a la compra (recepción real), no a la orden
// (ERS v0.9, 6.8.26): el FOB y las cantidades salen de purchase_details, ya
// que reflejan lo realmente recibido, que puede diferir de lo ordenado en
// una recepción parcial.
export class CreateRetaceoUseCase {
  constructor(retaceoRepository, purchaseRepository, purchaseOrderRepository) {
    this.retaceoRepository = retaceoRepository;
    this.purchaseRepository = purchaseRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(
    {
      purchase: purchaseId,
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
    const purchase = await this.purchaseRepository.findById(purchaseId, company);
    if (!purchase) throw new PurchaseNotFoundForRetaceoError();
    if (purchase.status !== 'received') throw new PurchaseNotRetaceableError();

    const existing = await this.retaceoRepository.findByPurchase(purchaseId, company);
    if (existing) throw new PurchaseAlreadyRetaceadoError();

    if (Number(totalFreight) < 0) throw new InvalidFreightAmountError();
    if (Number(totalDai) < 0) throw new InvalidDaiAmountError();

    const purchaseOrderId = purchase.purchaseOrder?._id || purchase.purchaseOrder;
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId, company);
    const orderCostableExpenses = round2(
      (order?.expenses || []).filter((expense) => expense.isCostable).reduce((sum, expense) => sum + expense.amount, 0),
    );

    const totalFob = purchase.subtotal;
    const orderFob = order?.subtotal || totalFob;

    // Una orden se puede recibir (y retacear) en varias recepciones
    // parciales. Los gastos costeables viven en la orden, no en la
    // recepción, así que cada retaceo solo debe cargar la porción de esos
    // gastos que le corresponde a lo que él mismo recibió, según su
    // participación en el FOB total de la orden — si no se prorratea, cada
    // recepción retaceada carga el 100% del gasto y se duplica entre
    // recepciones de la misma orden.
    const expenseShare = orderFob > 0 ? totalFob / orderFob : 1;
    const costableExpenses = round2(orderCostableExpenses * expenseShare);

    const freight = round2(totalFreight);
    const dai = round2(totalDai);
    const expenses = costableExpenses;

    const lines = purchase.details.map((detail) => ({
      product: detail.product?._id || detail.product,
      purchaseDetail: detail.id,
      quantity: detail.quantityReceived,
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
        purchaseDetail: line.purchaseDetail,
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
      purchase: purchase.id,
      supplier: purchase.supplier?._id || purchase.supplier,
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
