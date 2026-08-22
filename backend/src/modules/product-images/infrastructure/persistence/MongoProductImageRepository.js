import mongoose from 'mongoose';
import { ProductImageRepository } from '../../domain/ProductImageRepository.js';
import { ProductImage } from '../../domain/ProductImage.js';
import { InvalidProductImageIdError } from '../../domain/errors.js';
import { ProductImageModel } from './productImageMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new ProductImage({
              id: doc._id.toString(),
              uuid: doc.uuid,
              productId: doc.productId,
              path: doc.path,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidProductImageIdError();
    }
};

export class MongoProductImageRepository extends ProductImageRepository {
    async findAllByProduct(productId, { isActive } = {}) {
        const filter = { productId };

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const docs = await ProductImageModel.find(filter).sort({ createdAt: -1 });
        return docs.map(toDomain);
    }

    async findById(id) {
        assertValidId(id);
        const doc = await ProductImageModel.findById(id);
        return toDomain(doc);
    }

    async create(productImage) {
        const doc = await ProductImageModel.create({
            productId: productImage.productId,
            uuid: productImage.uuid,
            path: productImage.path,
        });
        return toDomain(doc);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await ProductImageModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        });
        return toDomain(doc);
    }

    async findCoversByProducts(productIds) {
        // .aggregate() no castea strings contra el schema como sí hace .find(),
        // hay que convertir a ObjectId a mano o el $in no encuentra nada.
        const objectIds = productIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (objectIds.length === 0) return [];

        const results = await ProductImageModel.aggregate([
            { $match: { productId: { $in: objectIds }, isActive: true } },
            { $sort: { createdAt: 1 } },
            { $group: { _id: '$productId', path: { $first: '$path' } } },
        ]);

        return results.map((r) => ({ productId: r._id.toString(), path: r.path }));
    }
}
