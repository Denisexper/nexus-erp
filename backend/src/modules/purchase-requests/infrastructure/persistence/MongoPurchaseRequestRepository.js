import mongoose from 'mongoose';
import { PurchaseRequestRepository } from '../../domain/PurchaseRequestRepository.js';
import { PurchaseRequest } from '../../domain/PurchaseRequest.js';
import { InvalidPurchaseRequestIdError } from '../../domain/errors.js';
import { PurchaseRequestModel } from './purchaseRequestMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new PurchaseRequest({
              id: doc._id.toString(),
              company: doc.company,
              code: doc.code,
              branch: doc.branch,
              warehouse: doc.warehouse,
              user: doc.user,
              requestDate: doc.requestDate,
              requiredDate: doc.requiredDate,
              justification: doc.justification,
              status: doc.status,
              notes: doc.notes,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseRequestIdError();
    }
};

const POPULATE = [
    { path: 'branch', select: 'name' },
    { path: 'warehouse', select: 'name' },
    { path: 'user', select: 'name email' },
];

export class MongoPurchaseRequestRepository extends PurchaseRequestRepository {
    async findAll({ search, company, status, branch, warehouse, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) filter.code = { $regex: search, $options: 'i' };
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (branch) filter.branch = branch;
        if (warehouse) filter.warehouse = warehouse;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            PurchaseRequestModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            PurchaseRequestModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await PurchaseRequestModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await PurchaseRequestModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async getNextCode(companyId) {
        const last = await PurchaseRequestModel.findOne({ company: companyId }).sort({ code: -1 }).select('code');
        const lastNumber = last ? parseInt(last.code.split('-')[1], 10) || 0 : 0;
        return `SCR-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create(purchaseRequest) {
        const doc = await PurchaseRequestModel.create({
            company: purchaseRequest.company,
            code: purchaseRequest.code,
            branch: purchaseRequest.branch,
            warehouse: purchaseRequest.warehouse,
            user: purchaseRequest.user,
            requestDate: purchaseRequest.requestDate,
            requiredDate: purchaseRequest.requiredDate,
            justification: purchaseRequest.justification,
            notes: purchaseRequest.notes,
            status: purchaseRequest.status,
        });
        return toDomain(await doc.populate(POPULATE));
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await PurchaseRequestModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
