import mongoose from 'mongoose';
import { PurchaseRequestDetailRepository } from '../../domain/PurchaseRequestDetailRepository.js';
import { PurchaseRequestDetail } from '../../domain/PurchaseRequestDetail.js';
import { InvalidPurchaseRequestDetailIdError } from '../../domain/errors.js';
import { PurchaseRequestDetailModel } from './purchaseRequestDetailMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new PurchaseRequestDetail({
              id: doc._id.toString(),
              purchaseRequest: doc.purchaseRequest,
              product: doc.product,
              quantity: doc.quantity,
              unit: doc.unit,
              description: doc.description,
              notes: doc.notes,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseRequestDetailIdError();
    }
};

const POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
    { path: 'unit', select: 'name type' },
];

export class MongoPurchaseRequestDetailRepository extends PurchaseRequestDetailRepository {
    async findAll({ purchaseRequest, page = 1, limit = 10 } = {}) {
        const filter = {};
        if (purchaseRequest) filter.purchaseRequest = purchaseRequest;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            PurchaseRequestDetailModel.find(filter).populate(POPULATE).sort({ createdAt: 1 }).skip(skip).limit(limit),
            PurchaseRequestDetailModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, purchaseRequestIds) {
        assertValidId(id);
        const filter = purchaseRequestIds ? { _id: id, purchaseRequest: { $in: purchaseRequestIds } } : { _id: id };
        const doc = await PurchaseRequestDetailModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async countByPurchaseRequest(purchaseRequestId) {
        return PurchaseRequestDetailModel.countDocuments({ purchaseRequest: purchaseRequestId });
    }

    async create(purchaseRequestDetail) {
        const doc = await PurchaseRequestDetailModel.create({
            purchaseRequest: purchaseRequestDetail.purchaseRequest,
            product: purchaseRequestDetail.product,
            quantity: purchaseRequestDetail.quantity,
            unit: purchaseRequestDetail.unit,
            description: purchaseRequestDetail.description,
            notes: purchaseRequestDetail.notes,
        });
        return toDomain(await doc.populate(POPULATE));
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await PurchaseRequestDetailModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }

    async delete(id) {
        assertValidId(id);
        await PurchaseRequestDetailModel.findByIdAndDelete(id);
    }
}
