import mongoose from 'mongoose';
import { SupplierContactRepository } from '../../domain/SupplierContactRepository.js';
import { SupplierContact } from '../../domain/SupplierContact.js';
import { InvalidSupplierContactIdError } from '../../domain/errors.js';
import { SupplierContactModel } from './supplierContactMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new SupplierContact({
              id: doc._id.toString(),
              supplier: doc.supplier,
              fullName: doc.fullName,
              phone: doc.phone,
              email: doc.email,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidSupplierContactIdError();
    }
};

const POPULATE = { path: 'supplier', select: 'name' };

export class MongoSupplierContactRepository extends SupplierContactRepository {
    async findAll({ search, supplier, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        if (supplier) filter.supplier = supplier;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            SupplierContactModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            SupplierContactModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, supplierIds) {
        assertValidId(id);
        const filter = supplierIds ? { _id: id, supplier: { $in: supplierIds } } : { _id: id };
        const doc = await SupplierContactModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async create(supplierContact) {
        const doc = await SupplierContactModel.create({
            supplier: supplierContact.supplier,
            fullName: supplierContact.fullName,
            phone: supplierContact.phone,
            email: supplierContact.email,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await SupplierContactModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
