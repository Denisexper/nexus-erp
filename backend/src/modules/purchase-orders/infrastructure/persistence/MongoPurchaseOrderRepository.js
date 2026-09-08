import mongoose from 'mongoose';
import { PurchaseOrderRepository } from '../../domain/PurchaseOrderRepository.js';
import { PurchaseOrder } from '../../domain/PurchaseOrder.js';
import { PurchaseOrderDetail } from '../../domain/PurchaseOrderDetail.js';
import { InvalidPurchaseOrderIdError } from '../../domain/errors.js';
import { PurchaseOrderModel } from './purchaseOrderMongooseModel.js';
import { PurchaseOrderDetailModel } from './purchaseOrderDetailMongooseModel.js';
import { PurchaseOrderExpenseModel } from './purchaseOrderExpenseMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseOrderIdError();
    }
};

const HEADER_POPULATE = [
    { path: 'supplier', select: 'name code' },
    { path: 'branch', select: 'name' },
    { path: 'warehouse', select: 'name' },
    { path: 'purchaseQuotation', select: 'code' },
    { path: 'user', select: 'name email' },
];

const DETAIL_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
    { path: 'unit', select: 'name type' },
];

const toExpenseDomain = (doc) => ({
    id: doc._id.toString(),
    expenseType: doc.expenseType,
    description: doc.description,
    amount: doc.amount,
});

const toDetailDomain = (doc) =>
    new PurchaseOrderDetail({
        id: doc._id.toString(),
        purchaseOrder: doc.purchaseOrder,
        product: doc.product,
        quantity: doc.quantity,
        unit: doc.unit,
        unitPrice: doc.unitPrice,
        discount: doc.discount,
        subtotal: doc.subtotal,
        taxRate: doc.taxRate,
        taxAmount: doc.taxAmount,
        total: doc.total,
        notes: doc.notes,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });

const toDomain = (doc, details = [], expenses = []) =>
    doc
        ? new PurchaseOrder({
              id: doc._id.toString(),
              company: doc.company,
              code: doc.code,
              supplier: doc.supplier,
              branch: doc.branch,
              warehouse: doc.warehouse,
              purchaseQuotation: doc.purchaseQuotation,
              user: doc.user,
              orderDate: doc.orderDate,
              expectedDate: doc.expectedDate,
              currency: doc.currency,
              paymentTerms: doc.paymentTerms,
              subtotal: doc.subtotal,
              discount: doc.discount,
              tax: doc.tax,
              additionalExpenses: doc.additionalExpenses,
              total: doc.total,
              status: doc.status,
              notes: doc.notes,
              details,
              expenses,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoPurchaseOrderRepository extends PurchaseOrderRepository {
    async findAll({ search, company, status, supplier, purchaseQuotation, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) filter.code = { $regex: search, $options: 'i' };
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (purchaseQuotation) filter.purchaseQuotation = purchaseQuotation;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            PurchaseOrderModel.find(filter).populate(HEADER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            PurchaseOrderModel.countDocuments(filter),
        ]);

        return { items: docs.map((doc) => toDomain(doc)), total };
    }

    async #loadAggregate(doc) {
        if (!doc) return null;

        const [detailDocs, expenseDocs] = await Promise.all([
            PurchaseOrderDetailModel.find({ purchaseOrder: doc._id }).populate(DETAIL_POPULATE).sort({ createdAt: 1 }),
            PurchaseOrderExpenseModel.find({ purchaseOrder: doc._id }).populate('expenseType', 'name'),
        ]);

        return toDomain(doc, detailDocs.map(toDetailDomain), expenseDocs.map(toExpenseDomain));
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await PurchaseOrderModel.findOne(filter).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async getNextCode(companyId) {
        const last = await PurchaseOrderModel.findOne({ company: companyId }).sort({ code: -1 }).select('code');
        const lastNumber = last ? parseInt(last.code.split('-')[1], 10) || 0 : 0;
        return `OC-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create({ order, lines, expenses }) {
        const orderDoc = await PurchaseOrderModel.create({
            company: order.company,
            code: order.code,
            supplier: order.supplier,
            branch: order.branch,
            warehouse: order.warehouse,
            purchaseQuotation: order.purchaseQuotation,
            orderDate: order.orderDate,
            expectedDate: order.expectedDate,
            currency: order.currency,
            paymentTerms: order.paymentTerms,
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            additionalExpenses: order.additionalExpenses,
            total: order.total,
            notes: order.notes,
            user: order.user,
            status: order.status,
        });

        for (const line of lines) {
            await PurchaseOrderDetailModel.create({
                purchaseOrder: orderDoc._id,
                product: line.product,
                quantity: line.quantity,
                unit: line.unit,
                unitPrice: line.unitPrice,
                discount: line.discount,
                subtotal: line.subtotal,
                taxRate: line.taxRate,
                taxAmount: line.taxAmount,
                total: line.total,
                notes: line.notes,
            });
        }

        for (const expense of expenses) {
            await PurchaseOrderExpenseModel.create({
                purchaseOrder: orderDoc._id,
                expenseType: expense.expenseType,
                description: expense.description,
                amount: expense.amount,
            });
        }

        return this.findById(orderDoc._id.toString());
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await PurchaseOrderModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async addExpense(id, expense) {
        assertValidId(id);
        await PurchaseOrderExpenseModel.create({
            purchaseOrder: id,
            expenseType: expense.expenseType,
            description: expense.description,
            amount: expense.amount,
        });

        // additionalExpenses/total del header se recalculan sobre la suma real
        // de gastos (no se acumulan a mano) para evitar drift si esto se llama
        // más de una vez.
        const [expenseDocs, orderDoc] = await Promise.all([
            PurchaseOrderExpenseModel.find({ purchaseOrder: id }),
            PurchaseOrderModel.findById(id),
        ]);
        const additionalExpenses = expenseDocs.reduce((sum, e) => sum + e.amount, 0);
        const total = orderDoc.subtotal + orderDoc.tax + additionalExpenses;

        const doc = await PurchaseOrderModel.findByIdAndUpdate(
            id,
            { additionalExpenses, total },
            { new: true, runValidators: true },
        ).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }
}
