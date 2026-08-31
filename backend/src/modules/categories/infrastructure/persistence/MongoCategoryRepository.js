import mongoose from 'mongoose';
import { CategoryRepository } from '../../domain/CategoryRepository.js';
import { Category } from '../../domain/Category.js';
import { InvalidCategoryIdError } from '../../domain/errors.js';
import { CategoryModel } from './categoryMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Category({
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
        throw new InvalidCategoryIdError();
    }
};

export class MongoCategoryRepository extends CategoryRepository {
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
            CategoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
            CategoryModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await CategoryModel.findOne(filter);
        return toDomain(doc);
    }

    async findByNameAndCompany(name, companyId) {
        const doc = await CategoryModel.findOne({ name, company: companyId });
        return toDomain(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await CategoryModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(category) {
        const doc = await CategoryModel.create({
            company: category.company,
            name: category.name,
            description: category.description,
        });
        return toDomain(doc);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await CategoryModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        });
        return toDomain(doc);
    }
}
