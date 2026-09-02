import mongoose from 'mongoose';
import { ProductRepository } from '../../domain/ProductRepository.js';
import { Product } from '../../domain/Product.js';
import { InvalidProductIdError } from '../../domain/errors.js';
import { ProductModel } from './productMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Product({
              id: doc._id.toString(),
              company: doc.company,
              subCategory: doc.subCategory,
              category: doc.category,
              purchaseUnit: doc.purchaseUnit,
              saleUnit: doc.saleUnit,
              uuid: doc.uuid,
              internalCode: doc.internalCode,
              originalCode: doc.originalCode,
              sku: doc.sku,
              name: doc.name,
              size: doc.size,
              dimensions: doc.dimensions,
              description: doc.description,
              presentation: doc.presentation,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidProductIdError();
    }
};

const POPULATE = [
    { path: 'subCategory', select: 'name category' },
    { path: 'category', select: 'name' },
    { path: 'purchaseUnit', select: 'name type' },
    { path: 'saleUnit', select: 'name type' },
];

export class MongoProductRepository extends ProductRepository {
    async findAll({ search, company, subCategory, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { internalCode: { $regex: search, $options: 'i' } },
                { originalCode: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
            ];
        }

        if (company) filter.company = company;
        if (subCategory) filter.subCategory = subCategory;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            ProductModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            ProductModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await ProductModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findByInternalCodeAndCompany(internalCode, companyId) {
        const doc = await ProductModel.findOne({ internalCode, company: companyId });
        return toDomain(doc);
    }

    async findBySkuAndCompany(sku, companyId) {
        const doc = await ProductModel.findOne({ sku, company: companyId });
        return toDomain(doc);
    }

    async findIdsByCompany(companyId) {
        const docs = await ProductModel.find({ company: companyId }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(product) {
        const doc = await ProductModel.create({
            company: product.company,
            subCategory: product.subCategory,
            category: product.category,
            purchaseUnit: product.purchaseUnit,
            saleUnit: product.saleUnit,
            uuid: product.uuid,
            internalCode: product.internalCode,
            originalCode: product.originalCode,
            sku: product.sku,
            name: product.name,
            size: product.size,
            dimensions: product.dimensions,
            description: product.description,
            presentation: product.presentation,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await ProductModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}
