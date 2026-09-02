import mongoose from 'mongoose';
import { SubCategoryRepository } from '../../domain/SubCategoryRepository.js';
import { SubCategory } from '../../domain/SubCategory.js';
import { InvalidSubCategoryIdError } from '../../domain/errors.js';
import { SubCategoryModel } from './subCategoryMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new SubCategory({
              id: doc._id.toString(),
              category: doc.category,
              name: doc.name,
              description: doc.description,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidSubCategoryIdError();
    }
};

const POPULATE = { path: 'category', select: 'name' };

export class MongoSubCategoryRepository extends SubCategoryRepository {
    async findAll({ search, category, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        if (category) filter.category = category;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            SubCategoryModel.find(filter).populate(POPULATE).sort({ name: 1 }).skip(skip).limit(limit),
            SubCategoryModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, categoryIds) {
        assertValidId(id);
        const filter = categoryIds ? { _id: id, category: { $in: categoryIds } } : { _id: id };
        const doc = await SubCategoryModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findByNameAndCategory(name, categoryId) {
        const doc = await SubCategoryModel.findOne({ name, category: categoryId });
        return toDomain(doc);
    }

    async findIdsByCategories(categoryIds) {
        const docs = await SubCategoryModel.find({ category: { $in: categoryIds } }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(subCategory) {
        const doc = await SubCategoryModel.create({
            category: subCategory.category,
            name: subCategory.name,
            description: subCategory.description,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await SubCategoryModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
