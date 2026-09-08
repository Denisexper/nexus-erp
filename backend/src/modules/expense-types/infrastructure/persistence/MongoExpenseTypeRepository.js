import mongoose from 'mongoose';
import { ExpenseTypeRepository } from '../../domain/ExpenseTypeRepository.js';
import { ExpenseType } from '../../domain/ExpenseType.js';
import { InvalidExpenseTypeIdError } from '../../domain/errors.js';
import { ExpenseTypeModel } from './expenseTypeMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new ExpenseType({
              id: doc._id.toString(),
              company: doc.company,
              name: doc.name,
              description: doc.description,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidExpenseTypeIdError();
    }
};

export class MongoExpenseTypeRepository extends ExpenseTypeRepository {
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
            ExpenseTypeModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
            ExpenseTypeModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await ExpenseTypeModel.findOne(filter);
        return toDomain(doc);
    }

    async findByNameAndCompany(name, companyId) {
        const doc = await ExpenseTypeModel.findOne({ name, company: companyId });
        return toDomain(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await ExpenseTypeModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(expenseType) {
        const doc = await ExpenseTypeModel.create({
            company: expenseType.company,
            name: expenseType.name,
            description: expenseType.description,
        });
        return toDomain(doc);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await ExpenseTypeModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        });
        return toDomain(doc);
    }
}
