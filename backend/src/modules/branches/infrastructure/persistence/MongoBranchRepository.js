import mongoose from 'mongoose';
import { BranchRepository } from '../../domain/BranchRepository.js';
import { Branch } from '../../domain/Branch.js';
import { InvalidBranchIdError } from '../../domain/errors.js';
import { BranchModel } from './branchMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Branch({
              id: doc._id.toString(),
              company: doc.company,
              name: doc.name,
              address: doc.address,
              department: doc.department,
              municipality: doc.municipality,
              district: doc.district,
              phone: doc.phone,
              email: doc.email,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidBranchIdError();
    }
};

const POPULATE = [
    { path: 'company', select: 'name commercialName' },
    { path: 'department', select: 'code name shortName' },
    { path: 'municipality', select: 'code name' },
    { path: 'district', select: 'code name' },
];

/**
 * Adaptador concreto del puerto BranchRepository usando Mongoose. Único
 * archivo del módulo que conoce sintaxis de Mongo.
 */
export class MongoBranchRepository extends BranchRepository {
    async findAll({ search, company, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        if (company) filter.company = company;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            BranchModel.find(filter)
                .populate(POPULATE)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BranchModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const doc = await BranchModel.findOne({ _id: id, company: companyId }).populate(POPULATE);
        return toDomain(doc);
    }

    async findByNameAndCompany(name, companyId) {
        const doc = await BranchModel.findOne({ name, company: companyId });
        return toDomain(doc);
    }

    async create(branch) {
        const doc = await BranchModel.create({
            company: branch.company,
            name: branch.name,
            address: branch.address,
            department: branch.department,
            municipality: branch.municipality,
            district: branch.district,
            phone: branch.phone,
            email: branch.email,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await BranchModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
