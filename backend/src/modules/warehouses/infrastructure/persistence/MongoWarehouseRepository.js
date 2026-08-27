import mongoose from 'mongoose';
import { WarehouseRepository } from '../../domain/WarehouseRepository.js';
import { Warehouse } from '../../domain/Warehouse.js';
import { InvalidWarehouseIdError } from '../../domain/errors.js';
import { WarehouseModel } from './warehouseMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Warehouse({
              id: doc._id.toString(),
              branch: doc.branch,
              warehouseCategory: doc.warehouseCategory,
              name: doc.name,
              description: doc.description,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidWarehouseIdError();
    }
};

const POPULATE = [
    { path: 'branch', select: 'name company' },
    { path: 'warehouseCategory', select: 'name' },
];

export class MongoWarehouseRepository extends WarehouseRepository {
    async findAll({ search, branch, warehouseCategory, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        if (branch) filter.branch = branch;
        if (warehouseCategory) filter.warehouseCategory = warehouseCategory;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            WarehouseModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            WarehouseModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, branchIds) {
        assertValidId(id);
        const filter = branchIds ? { _id: id, branch: { $in: branchIds } } : { _id: id };
        const doc = await WarehouseModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findByNameAndBranch(name, branchId) {
        const doc = await WarehouseModel.findOne({ name, branch: branchId });
        return toDomain(doc);
    }

    async findIdsByBranches(branchIds) {
        const docs = await WarehouseModel.find({ branch: { $in: branchIds } }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(warehouse) {
        const doc = await WarehouseModel.create({
            branch: warehouse.branch,
            warehouseCategory: warehouse.warehouseCategory,
            name: warehouse.name,
            description: warehouse.description,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await WarehouseModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
