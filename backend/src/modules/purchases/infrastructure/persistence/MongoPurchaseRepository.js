import mongoose from 'mongoose';
import { PurchaseRepository } from '../../domain/PurchaseRepository.js';
import { Purchase } from '../../domain/Purchase.js';
import { PurchaseDetail } from '../../domain/PurchaseDetail.js';
import { InvalidPurchaseIdError } from '../../domain/errors.js';
import { PurchaseModel } from './purchaseMongooseModel.js';
import { PurchaseDetailModel } from './purchaseDetailMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseIdError();
    }
};

const HEADER_POPULATE = [
    { path: 'purchaseOrder', select: 'code' },
    { path: 'supplier', select: 'name code' },
    { path: 'branch', select: 'name' },
    { path: 'warehouse', select: 'name' },
    { path: 'user', select: 'name email' },
];

const DETAIL_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
    { path: 'unit', select: 'name type' },
];

const toDetailDomain = (doc) =>
    new PurchaseDetail({
        id: doc._id.toString(),
        purchase: doc.purchase,
        purchaseOrderDetail: doc.purchaseOrderDetail,
        product: doc.product,
        quantityOrdered: doc.quantityOrdered,
        quantityReceived: doc.quantityReceived,
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

const toDomain = (doc, details = []) =>
    doc
        ? new Purchase({
              id: doc._id.toString(),
              company: doc.company,
              code: doc.code,
              purchaseOrder: doc.purchaseOrder,
              supplier: doc.supplier,
              branch: doc.branch,
              warehouse: doc.warehouse,
              purchaseDate: doc.purchaseDate,
              supplierInvoiceNumber: doc.supplierInvoiceNumber,
              supplierInvoiceDate: doc.supplierInvoiceDate,
              currency: doc.currency,
              subtotal: doc.subtotal,
              discount: doc.discount,
              tax: doc.tax,
              total: doc.total,
              status: doc.status,
              notes: doc.notes,
              user: doc.user,
              details,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoPurchaseRepository extends PurchaseRepository {
    async findAll({ search, company, status, supplier, purchaseOrder, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) filter.code = { $regex: search, $options: 'i' };
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (purchaseOrder) filter.purchaseOrder = purchaseOrder;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            PurchaseModel.find(filter).populate(HEADER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            PurchaseModel.countDocuments(filter),
        ]);

        return { items: docs.map((doc) => toDomain(doc)), total };
    }

    async #loadAggregate(doc) {
        if (!doc) return null;

        const detailDocs = await PurchaseDetailModel.find({ purchase: doc._id }).populate(DETAIL_POPULATE).sort({ createdAt: 1 });

        return toDomain(doc, detailDocs.map(toDetailDomain));
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await PurchaseModel.findOne(filter).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async getNextCode(companyId) {
        const last = await PurchaseModel.findOne({ company: companyId }).sort({ code: -1 }).select('code');
        const lastNumber = last ? parseInt(last.code.split('-')[1], 10) || 0 : 0;
        return `C-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    // Suma, por cada purchase_order_detail, lo ya recibido en compras no
    // canceladas contra esa orden. No filtramos por company acá porque el
    // caller (createPurchase) ya validó la orden contra la company del
    // usuario antes de llegar hasta este punto.
    async getReceivedQuantitiesByOrder(purchaseOrderId) {
        const purchases = await PurchaseModel.find({ purchaseOrder: purchaseOrderId, status: { $ne: 'cancelled' } }).select('_id');
        const purchaseIds = purchases.map((p) => p._id);
        if (purchaseIds.length === 0) return {};

        const details = await PurchaseDetailModel.find({ purchase: { $in: purchaseIds } }).select('purchaseOrderDetail quantityReceived');

        return details.reduce((acc, detail) => {
            const key = detail.purchaseOrderDetail.toString();
            acc[key] = (acc[key] || 0) + detail.quantityReceived;
            return acc;
        }, {});
    }

    async create({ purchase, lines }) {
        const purchaseDoc = await PurchaseModel.create({
            company: purchase.company,
            code: purchase.code,
            purchaseOrder: purchase.purchaseOrder,
            supplier: purchase.supplier,
            branch: purchase.branch,
            warehouse: purchase.warehouse,
            purchaseDate: purchase.purchaseDate,
            supplierInvoiceNumber: purchase.supplierInvoiceNumber,
            supplierInvoiceDate: purchase.supplierInvoiceDate,
            currency: purchase.currency,
            subtotal: purchase.subtotal,
            discount: purchase.discount,
            tax: purchase.tax,
            total: purchase.total,
            notes: purchase.notes,
            user: purchase.user,
            status: purchase.status,
        });

        for (const line of lines) {
            await PurchaseDetailModel.create({
                purchase: purchaseDoc._id,
                purchaseOrderDetail: line.purchaseOrderDetail,
                product: line.product,
                quantityOrdered: line.quantityOrdered,
                quantityReceived: line.quantityReceived,
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

        return this.findById(purchaseDoc._id.toString());
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await PurchaseModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }
}
