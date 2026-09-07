import mongoose from 'mongoose';
import { PurchaseQuotationRepository } from '../../domain/PurchaseQuotationRepository.js';
import { PurchaseQuotation } from '../../domain/PurchaseQuotation.js';
import { PurchaseQuotationDetail } from '../../domain/PurchaseQuotationDetail.js';
import { InvalidPurchaseQuotationIdError } from '../../domain/errors.js';
import { PurchaseQuotationModel } from './purchaseQuotationMongooseModel.js';
import { PurchaseQuotationDetailModel } from './purchaseQuotationDetailMongooseModel.js';
import { PurchaseQuotationExpenseModel } from './purchaseQuotationExpenseMongooseModel.js';
import { PurchaseQuotationRequestModel } from './purchaseQuotationRequestMongooseModel.js';
import { PurchaseQuotationRequestDetailModel } from './purchaseQuotationRequestDetailMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseQuotationIdError();
    }
};

const HEADER_POPULATE = [
    { path: 'supplier', select: 'name code' },
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

const toDetailDomain = (doc, sources) =>
    new PurchaseQuotationDetail({
        id: doc._id.toString(),
        purchaseQuotation: doc.purchaseQuotation,
        product: doc.product,
        quantity: doc.quantity,
        unit: doc.unit,
        unitPrice: doc.unitPrice,
        discount: doc.discount,
        subtotal: doc.subtotal,
        taxRate: doc.taxRate,
        taxAmount: doc.taxAmount,
        total: doc.total,
        deliveryDays: doc.deliveryDays,
        availableQuantity: doc.availableQuantity,
        notes: doc.notes,
        sources,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });

const toDomain = (doc, details = [], expenses = []) =>
    doc
        ? new PurchaseQuotation({
              id: doc._id.toString(),
              company: doc.company,
              code: doc.code,
              supplier: doc.supplier,
              quotationDate: doc.quotationDate,
              validUntil: doc.validUntil,
              currency: doc.currency,
              paymentTerms: doc.paymentTerms,
              deliveryDays: doc.deliveryDays,
              subtotal: doc.subtotal,
              discount: doc.discount,
              tax: doc.tax,
              additionalExpenses: doc.additionalExpenses,
              total: doc.total,
              status: doc.status,
              notes: doc.notes,
              user: doc.user,
              details,
              expenses,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoPurchaseQuotationRepository extends PurchaseQuotationRepository {
    async findAll({ search, company, status, supplier, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) filter.code = { $regex: search, $options: 'i' };
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            PurchaseQuotationModel.find(filter).populate(HEADER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            PurchaseQuotationModel.countDocuments(filter),
        ]);

        return { items: docs.map((doc) => toDomain(doc)), total };
    }

    // Carga la cabecera junto con líneas, gastos y trazabilidad de origen —
    // el "aggregate" completo que necesita el detalle de una cotización.
    async #loadAggregate(doc) {
        if (!doc) return null;

        const [detailDocs, expenseDocs] = await Promise.all([
            PurchaseQuotationDetailModel.find({ purchaseQuotation: doc._id }).populate(DETAIL_POPULATE).sort({ createdAt: 1 }),
            PurchaseQuotationExpenseModel.find({ purchaseQuotation: doc._id }).populate('expenseType', 'name'),
        ]);

        const detailIds = detailDocs.map((d) => d._id);
        const sourceDocs = await PurchaseQuotationRequestDetailModel.find({ purchaseQuotationDetail: { $in: detailIds } })
            .populate({
                path: 'purchaseRequestDetail',
                select: 'purchaseRequest product quantity',
                populate: { path: 'purchaseRequest', select: 'code' },
            });

        const sourcesByDetail = sourceDocs.reduce((acc, s) => {
            const key = s.purchaseQuotationDetail.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push({ id: s._id.toString(), purchaseRequestDetail: s.purchaseRequestDetail, quantity: s.quantity });
            return acc;
        }, {});

        const details = detailDocs.map((d) => toDetailDomain(d, sourcesByDetail[d._id.toString()] || []));
        const expenses = expenseDocs.map(toExpenseDomain);

        return toDomain(doc, details, expenses);
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await PurchaseQuotationModel.findOne(filter).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await PurchaseQuotationModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async getNextCode(companyId) {
        const last = await PurchaseQuotationModel.findOne({ company: companyId }).sort({ code: -1 }).select('code');
        const lastNumber = last ? parseInt(last.code.split('-')[1], 10) || 0 : 0;
        return `COT-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create({ quotation, lines, expenses }) {
        const quotationDoc = await PurchaseQuotationModel.create({
            company: quotation.company,
            code: quotation.code,
            supplier: quotation.supplier,
            quotationDate: quotation.quotationDate,
            validUntil: quotation.validUntil,
            currency: quotation.currency,
            paymentTerms: quotation.paymentTerms,
            deliveryDays: quotation.deliveryDays,
            subtotal: quotation.subtotal,
            discount: quotation.discount,
            tax: quotation.tax,
            additionalExpenses: quotation.additionalExpenses,
            total: quotation.total,
            notes: quotation.notes,
            user: quotation.user,
            status: quotation.status,
        });

        const requestIds = new Set();

        for (const line of lines) {
            const detailDoc = await PurchaseQuotationDetailModel.create({
                purchaseQuotation: quotationDoc._id,
                product: line.product,
                quantity: line.quantity,
                unit: line.unit,
                unitPrice: line.unitPrice,
                discount: line.discount,
                subtotal: line.subtotal,
                taxRate: line.taxRate,
                taxAmount: line.taxAmount,
                total: line.total,
                deliveryDays: line.deliveryDays,
                availableQuantity: line.availableQuantity,
                notes: line.notes,
            });

            for (const source of line.sources) {
                await PurchaseQuotationRequestDetailModel.create({
                    purchaseQuotationDetail: detailDoc._id,
                    purchaseRequestDetail: source.purchaseRequestDetail,
                    quantity: source.quantity,
                });
                requestIds.add(String(source.purchaseRequestId));
            }
        }

        for (const requestId of requestIds) {
            await PurchaseQuotationRequestModel.create({
                purchaseQuotation: quotationDoc._id,
                purchaseRequest: requestId,
            });
        }

        for (const expense of expenses) {
            await PurchaseQuotationExpenseModel.create({
                purchaseQuotation: quotationDoc._id,
                expenseType: expense.expenseType,
                description: expense.description,
                amount: expense.amount,
            });
        }

        return this.findById(quotationDoc._id.toString());
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await PurchaseQuotationModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async findCoveredRequestDetailIds(purchaseRequestDetailIds) {
        if (!purchaseRequestDetailIds || purchaseRequestDetailIds.length === 0) return [];
        const docs = await PurchaseQuotationRequestDetailModel.find({
            purchaseRequestDetail: { $in: purchaseRequestDetailIds },
        }).distinct('purchaseRequestDetail');
        return docs.map((id) => id.toString());
    }

    async findComparisonForRequestDetailIds(purchaseRequestDetailIds, companyId) {
        if (!purchaseRequestDetailIds || purchaseRequestDetailIds.length === 0) return [];

        const sourceDocs = await PurchaseQuotationRequestDetailModel.find({
            purchaseRequestDetail: { $in: purchaseRequestDetailIds },
        });
        if (sourceDocs.length === 0) return [];

        const detailIds = [...new Set(sourceDocs.map((s) => s.purchaseQuotationDetail.toString()))];
        const detailDocs = await PurchaseQuotationDetailModel.find({ _id: { $in: detailIds } }).populate(DETAIL_POPULATE);

        const quotationIds = [...new Set(detailDocs.map((d) => d.purchaseQuotation.toString()))];
        const quotationDocs = await PurchaseQuotationModel.find({
            _id: { $in: quotationIds },
            company: companyId,
            status: { $ne: 'cancelled' },
        }).populate(HEADER_POPULATE);

        const sourcesByDetail = sourceDocs.reduce((acc, s) => {
            const key = s.purchaseQuotationDetail.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push({ purchaseRequestDetail: s.purchaseRequestDetail, quantity: s.quantity });
            return acc;
        }, {});

        const detailsByQuotation = detailDocs.reduce((acc, d) => {
            const key = d.purchaseQuotation.toString();
            if (!acc[key]) acc[key] = [];
            // Solo se listan las fuentes relacionadas a esta solicitud, aunque la
            // línea también consolide cantidades de otras (Regla 3 del ERS).
            const relevantSources = (sourcesByDetail[d._id.toString()] || [])
                .filter((s) => purchaseRequestDetailIds.includes(String(s.purchaseRequestDetail._id || s.purchaseRequestDetail)));
            if (relevantSources.length === 0) return acc;
            acc[key].push(toDetailDomain(d, relevantSources));
            return acc;
        }, {});

        return quotationDocs
            .map((doc) => ({
                quotation: toDomain(doc),
                lines: detailsByQuotation[doc._id.toString()] || [],
            }))
            .filter((entry) => entry.lines.length > 0);
    }
}
