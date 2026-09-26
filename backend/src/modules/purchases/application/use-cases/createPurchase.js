import { Purchase } from '../../domain/Purchase.js';
import { PurchaseDetail } from '../../domain/PurchaseDetail.js';
import {
  PurchaseOrderNotFoundForPurchaseError,
  PurchaseOrderNotReceivableError,
  InactiveBranchForPurchaseError,
  PurchaseOrderDetailNotFoundError,
  QuantityReceivedExceedsOrderedError,
  InvalidQuantityReceivedError,
  EmptyPurchaseError,
} from '../../domain/errors.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Una orden todavía admite recepciones mientras no esté cerrada/cancelada y
// no se haya completado ya (CA-COM-017/018 del ERS).
const RECEIVABLE_ORDER_STATUSES = ['approved', 'partially_received'];

// RN-008/6.8.21-24 del ERS: la compra representa lo realmente recibido
// contra una orden, y admite recepciones parciales a través de múltiples
// compras. No se toca Kardex acá (6.8.46: la actualización de existencias es
// responsabilidad del módulo de Inventario, que todavía no existe).
export class CreatePurchaseUseCase {
  constructor(purchaseRepository, purchaseOrderRepository, branchRepository) {
    this.purchaseRepository = purchaseRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.branchRepository = branchRepository;
  }

  async execute(
    { purchaseOrder, purchaseDate, supplierInvoiceNumber, supplierInvoiceDate, currency, notes, lines = [] },
    company,
    user,
  ) {
    const order = await this.purchaseOrderRepository.findById(purchaseOrder, company);
    if (!order) throw new PurchaseOrderNotFoundForPurchaseError();
    if (!RECEIVABLE_ORDER_STATUSES.includes(order.status)) throw new PurchaseOrderNotReceivableError();
    if (!lines.length) throw new EmptyPurchaseError();

    // order.branch viene poblado solo con 'name' (HEADER_POPULATE), así que
    // se resuelve isActive con un fetch aparte en vez de asumirlo presente.
    const branchId = order.branch?._id || order.branch;
    const branchDoc = await this.branchRepository.findById(branchId, company);
    if (branchDoc && !branchDoc.isActive) throw new InactiveBranchForPurchaseError();

    const receivedByDetail = await this.purchaseRepository.getReceivedQuantitiesByOrder(order.id);

    const details = lines.map(({ purchaseOrderDetail, quantityReceived, notes: lineNotes }) => {
      const orderDetail = order.details.find((d) => d.id === purchaseOrderDetail);
      if (!orderDetail) throw new PurchaseOrderDetailNotFoundError();

      const qty = Number(quantityReceived);
      if (!(qty > 0)) throw new InvalidQuantityReceivedError();

      const alreadyReceived = receivedByDetail[orderDetail.id] || 0;
      const remaining = orderDetail.quantity - alreadyReceived;
      if (qty > remaining + 0.0001) throw new QuantityReceivedExceedsOrderedError();

      // El descuento de la línea de orden se prorratea según qué fracción de
      // la cantidad total se está recibiendo en esta compra.
      const discountRatio = orderDetail.quantity ? qty / orderDetail.quantity : 0;
      const discount = round2(orderDetail.discount * discountRatio);
      const subtotal = round2(qty * orderDetail.unitPrice - discount);
      const taxAmount = round2(subtotal * (orderDetail.taxRate / 100));
      const total = round2(subtotal + taxAmount);

      receivedByDetail[orderDetail.id] = alreadyReceived + qty;

      return new PurchaseDetail({
        purchaseOrderDetail: orderDetail.id,
        product: orderDetail.product?._id || orderDetail.product,
        quantityOrdered: orderDetail.quantity,
        quantityReceived: qty,
        unit: orderDetail.unit?._id || orderDetail.unit,
        unitPrice: orderDetail.unitPrice,
        discount,
        subtotal,
        taxRate: orderDetail.taxRate,
        taxAmount,
        total,
        notes: lineNotes,
      });
    });

    const subtotal = round2(details.reduce((sum, d) => sum + d.subtotal, 0));
    const discount = round2(details.reduce((sum, d) => sum + d.discount, 0));
    const tax = round2(details.reduce((sum, d) => sum + d.taxAmount, 0));
    const total = round2(subtotal + tax);

    const code = await this.purchaseRepository.getNextCode(company);

    const purchase = new Purchase({
      company,
      code,
      purchaseOrder: order.id,
      supplier: order.supplier?._id || order.supplier,
      branch: order.branch?._id || order.branch,
      warehouse: order.warehouse?._id || order.warehouse,
      purchaseDate: purchaseDate || new Date(),
      supplierInvoiceNumber,
      supplierInvoiceDate,
      currency: currency || order.currency,
      subtotal,
      discount,
      tax,
      total,
      notes,
      user,
      status: 'received',
    });

    const created = await this.purchaseRepository.create({ purchase, lines: details });

    // Con receivedByDetail ya actualizado con esta recepción, si toda línea
    // de la orden quedó completa la orden pasa a 'received', si no a
    // 'partially_received' (CA-COM-017).
    const isFullyReceived = order.details.every((d) => (receivedByDetail[d.id] || 0) + 0.0001 >= d.quantity);
    await this.purchaseOrderRepository.update(order.id, {
      status: isFullyReceived ? 'received' : 'partially_received',
    });

    return created;
  }
}
