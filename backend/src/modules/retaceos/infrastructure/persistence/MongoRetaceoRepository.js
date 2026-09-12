import mongoose from 'mongoose';
import { RetaceoRepository } from '../../domain/RetaceoRepository.js';
import { Retaceo } from '../../domain/Retaceo.js';
import { RetaceoDetail } from '../../domain/RetaceoDetail.js';
import { InvalidRetaceoIdError } from '../../domain/errors.js';
import { RetaceoModel } from './retaceoMongooseModel.js';
import { RetaceoDetailModel } from './retaceoDetailMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidRetaceoIdError();
    }
};

const HEADER_POPULATE = [
    { path: 'purchaseOrder', select: 'code' },
    { path: 'supplier', select: 'name code' },
    { path: 'user', select: 'name email' },
];

const DETAIL_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
];

const toDetailDomain = (doc) =>
    new RetaceoDetail({
        id: doc._id.toString(),
        retaceo: doc.retaceo,
        product: doc.product,
        quantity: doc.quantity,
        costFob: doc.costFob,
        freightAmount: doc.freightAmount,
        expenseAmount: doc.expenseAmount,
        daiAmount: doc.daiAmount,
        unitCost: doc.unitCost,
        totalCost: doc.totalCost,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });

const toDomain = (doc, details = []) =>
    doc
        ? new Retaceo({
              id: doc._id.toString(),
              company: doc.company,
              code: doc.code,
              purchaseOrder: doc.purchaseOrder,
              supplier: doc.supplier,
              retaceoDate: doc.retaceoDate,
              originCountry: doc.originCountry,
              importInvoiceNumber: doc.importInvoiceNumber,
              importInvoiceDate: doc.importInvoiceDate,
              importPolicyNumber: doc.importPolicyNumber,
              importPolicyDate: doc.importPolicyDate,
              totalFob: doc.totalFob,
              totalFreight: doc.totalFreight,
              totalExpenses: doc.totalExpenses,
              totalDai: doc.totalDai,
              totalCost: doc.totalCost,
              status: doc.status,
              notes: doc.notes,
              user: doc.user,
              details,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoRetaceoRepository extends RetaceoRepository {
    async findAll({ search, company, status, supplier, purchaseOrder, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) filter.code = { $regex: search, $options: 'i' };
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (purchaseOrder) filter.purchaseOrder = purchaseOrder;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            RetaceoModel.find(filter).populate(HEADER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            RetaceoModel.countDocuments(filter),
        ]);

        return { items: docs.map((doc) => toDomain(doc)), total };
    }

    async #loadAggregate(doc) {
        if (!doc) return null;

        const detailDocs = await RetaceoDetailModel.find({ retaceo: doc._id }).populate(DETAIL_POPULATE).sort({ createdAt: 1 });

        return toDomain(doc, detailDocs.map(toDetailDomain));
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await RetaceoModel.findOne(filter).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async findByPurchaseOrder(purchaseOrderId, companyId) {
        const filter = companyId ? { purchaseOrder: purchaseOrderId, company: companyId } : { purchaseOrder: purchaseOrderId };
        const doc = await RetaceoModel.findOne(filter).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }

    async getNextCode(companyId) {
        const last = await RetaceoModel.findOne({ company: companyId }).sort({ code: -1 }).select('code');
        const lastNumber = last ? parseInt(last.code.split('-')[1], 10) || 0 : 0;
        return `RTC-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create({ retaceo, details }) {
        const retaceoDoc = await RetaceoModel.create({
            company: retaceo.company,
            code: retaceo.code,
            purchaseOrder: retaceo.purchaseOrder,
            supplier: retaceo.supplier,
            retaceoDate: retaceo.retaceoDate,
            originCountry: retaceo.originCountry,
            importInvoiceNumber: retaceo.importInvoiceNumber,
            importInvoiceDate: retaceo.importInvoiceDate,
            importPolicyNumber: retaceo.importPolicyNumber,
            importPolicyDate: retaceo.importPolicyDate,
            totalFob: retaceo.totalFob,
            totalFreight: retaceo.totalFreight,
            totalExpenses: retaceo.totalExpenses,
            totalDai: retaceo.totalDai,
            totalCost: retaceo.totalCost,
            notes: retaceo.notes,
            user: retaceo.user,
            status: retaceo.status,
        });

        for (const detail of details) {
            await RetaceoDetailModel.create({
                retaceo: retaceoDoc._id,
                product: detail.product,
                quantity: detail.quantity,
                costFob: detail.costFob,
                freightAmount: detail.freightAmount,
                expenseAmount: detail.expenseAmount,
                daiAmount: detail.daiAmount,
                unitCost: detail.unitCost,
                totalCost: detail.totalCost,
            });
        }

        return this.findById(retaceoDoc._id.toString());
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await RetaceoModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(HEADER_POPULATE);
        return this.#loadAggregate(doc);
    }
}
