import mongoose from 'mongoose';
import { UnitRepository } from '../../domain/UnitRepository.js';
import { Unit } from '../../domain/Unit.js';
import { InvalidUnitIdError } from '../../domain/errors.js';
import { UnitModel } from './unitMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Unit({
              id: doc._id.toString(),
              company: doc.company,
              name: doc.name,
              type: doc.type,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidUnitIdError();
    }
};

export class MongoUnitRepository extends UnitRepository {
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
            UnitModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
            UnitModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await UnitModel.findOne(filter);
        return toDomain(doc);
    }

    async findByNameAndCompany(name, companyId) {
        const doc = await UnitModel.findOne({ name, company: companyId });
        return toDomain(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await UnitModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(unit) {
        const doc = await UnitModel.create({
            company: unit.company,
            name: unit.name,
            type: unit.type,
        });
        return toDomain(doc);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await UnitModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        });
        return toDomain(doc);
    }
}
