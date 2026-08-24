import mongoose from 'mongoose';
import { KardexRepository } from '../../domain/KardexRepository.js';
import { KardexMovement } from '../../domain/KardexMovement.js';
import { InvalidKardexIdError } from '../../domain/errors.js';
import { KardexMovementModel } from './kardexMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new KardexMovement({
              id: doc._id.toString(),
              product: doc.product,
              location: doc.location,
              type: doc.type,
              reason: doc.reason,
              quantity: doc.quantity,
              notes: doc.notes,
              transferRef: doc.transferRef,
              createdAt: doc.createdAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidKardexIdError();
    }
};

const POPULATE = [
    { path: 'product', select: 'name sku internalCode' },
    { path: 'location', select: 'code warehouse' },
];

// Suma firmada: 'in' cuenta positivo, 'out' cuenta negativo. Esta es la
// fórmula que define la existencia en todo el módulo: el stock nunca se
// guarda, siempre se calcula a partir del historial de movimientos.
const SIGNED_QUANTITY = {
    $cond: [{ $eq: ['$type', 'in'] }, '$quantity', { $multiply: ['$quantity', -1] }],
};

export class MongoKardexRepository extends KardexRepository {
    async findAll({ product, location, type, reason, page = 1, limit = 20 } = {}) {
        const filter = {};

        if (product) filter.product = product;
        if (location) filter.location = location;
        if (type) filter.type = type;
        if (reason) filter.reason = reason;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            KardexMovementModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            KardexMovementModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) || 1 };
    }

    async findById(id) {
        assertValidId(id);
        const doc = await KardexMovementModel.findById(id).populate(POPULATE);
        return toDomain(doc);
    }

    async create(movement) {
        const doc = await KardexMovementModel.create({
            product: movement.product,
            location: movement.location,
            type: movement.type,
            reason: movement.reason,
            quantity: movement.quantity,
            notes: movement.notes,
            transferRef: movement.transferRef,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async createMany(movements) {
        // No es una transacción multi-documento (el proyecto corre Mongo standalone
        // en desarrollo): Mongoose valida ambos documentos antes de enviar el
        // insert, así que la única forma de que quede un movimiento huérfano es
        // una caída de conexión a mitad de la escritura. Los datos ya se validaron
        // en el use case (producto, ubicaciones y stock) antes de llegar acá.
        const docs = await KardexMovementModel.insertMany(
            movements.map((movement) => ({
                product: movement.product,
                location: movement.location,
                type: movement.type,
                reason: movement.reason,
                quantity: movement.quantity,
                notes: movement.notes,
                transferRef: movement.transferRef,
            })),
        );
        const populated = await KardexMovementModel.populate(docs, POPULATE);
        return populated.map(toDomain);
    }

    async getStockByProductAndLocation(productId, locationId) {
        const result = await KardexMovementModel.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    location: new mongoose.Types.ObjectId(locationId),
                },
            },
            { $group: { _id: null, stock: { $sum: SIGNED_QUANTITY } } },
        ]);
        return result[0]?.stock ?? 0;
    }

    async getStockByLocation(locationId) {
        return KardexMovementModel.aggregate([
            { $match: { location: new mongoose.Types.ObjectId(locationId) } },
            { $group: { _id: '$product', stock: { $sum: SIGNED_QUANTITY } } },
            { $match: { stock: { $gt: 0 } } },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $project: { _id: 0, product: { _id: '$product._id', name: '$product.name', sku: '$product.sku', internalCode: '$product.internalCode' }, stock: 1 } },
            { $sort: { 'product.name': 1 } },
        ]);
    }

    async getStockByProduct(productId) {
        return KardexMovementModel.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: '$location', stock: { $sum: SIGNED_QUANTITY } } },
            { $match: { stock: { $gt: 0 } } },
            { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
            { $unwind: '$location' },
            { $project: { _id: 0, location: { _id: '$location._id', code: '$location.code', warehouse: '$location.warehouse' }, stock: 1 } },
            { $sort: { 'location.code': 1 } },
        ]);
    }

    async getTotalStockByLocation(locationId) {
        const result = await KardexMovementModel.aggregate([
            { $match: { location: new mongoose.Types.ObjectId(locationId) } },
            { $group: { _id: null, stock: { $sum: SIGNED_QUANTITY } } },
        ]);
        return result[0]?.stock ?? 0;
    }
}
