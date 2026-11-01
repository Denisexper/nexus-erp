import mongoose from 'mongoose';
import { InventoryRepository } from '../../domain/InventoryRepository.js';
import { InventoryLot } from '../../domain/InventoryLot.js';
import { InventoryMovement } from '../../domain/InventoryMovement.js';
import { InvalidInventoryLotIdError } from '../../domain/errors.js';
import { InventoryLotModel } from './inventoryLotMongooseModel.js';
import { InventoryLocationDetailModel } from './inventoryLocationDetailMongooseModel.js';
import { InventoryMovementModel } from './inventoryMovementMongooseModel.js';
import { InventoryCostAverageModel } from './inventoryCostAverageMongooseModel.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidInventoryLotIdError();
    }
};

const LOT_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
];

const MOVEMENT_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
    { path: 'inventoryLot', select: 'lotCode' },
    { path: 'warehouse', select: 'name' },
    { path: 'location', select: 'code' },
    { path: 'user', select: 'name email' },
];

const toMovementDomain = (doc) =>
    doc
        ? new InventoryMovement({
              id: doc._id.toString(),
              product: doc.product,
              inventoryLot: doc.inventoryLot,
              warehouse: doc.warehouse,
              location: doc.location,
              movementType: doc.movementType,
              movementDate: doc.movementDate,
              quantityIn: doc.quantityIn,
              quantityOut: doc.quantityOut,
              unitCost: doc.unitCost,
              totalCost: doc.totalCost,
              referenceType: doc.referenceType,
              referenceId: doc.referenceId,
              user: doc.user,
              createdAt: doc.createdAt,
          })
        : null;

const toLotDomain = (doc) =>
    doc
        ? new InventoryLot({
              id: doc._id.toString(),
              company: doc.company,
              lotCode: doc.lotCode,
              product: doc.product,
              purchaseDetail: doc.purchaseDetail,
              receivedAt: doc.receivedAt,
              quantityReceived: doc.quantityReceived,
              quantityAssigned: doc.quantityAssigned,
              unitCost: doc.unitCost,
              totalCost: doc.totalCost,
              status: doc.status,
              createdAt: doc.createdAt,
          })
        : null;

export class MongoInventoryRepository extends InventoryRepository {
    async findLots({ company, status, product, page = 1, limit = 10 } = {}) {
        const filter = {};
        if (company) filter.company = company;
        if (status) filter.status = status;
        if (product) filter.product = product;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            InventoryLotModel.find(filter).populate(LOT_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            InventoryLotModel.countDocuments(filter),
        ]);

        return { items: docs.map(toLotDomain), total };
    }

    async findLotById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await InventoryLotModel.findOne(filter).populate(LOT_POPULATE);
        return toLotDomain(doc);
    }

    async getNextLotCode(companyId) {
        const last = await InventoryLotModel.findOne({ company: companyId }).sort({ lotCode: -1 }).select('lotCode');
        const lastNumber = last ? parseInt(last.lotCode.split('-')[1], 10) || 0 : 0;
        return `LOT-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async createLotsFromPurchase(lots) {
        const docs = await InventoryLotModel.insertMany(
            lots.map((lot) => ({
                company: lot.company,
                lotCode: lot.lotCode,
                product: lot.product,
                purchaseDetail: lot.purchaseDetail,
                receivedAt: lot.receivedAt,
                quantityReceived: lot.quantityReceived,
                unitCost: lot.unitCost,
                totalCost: lot.totalCost,
                status: 'pending_placement',
            })),
        );
        return docs.map(toLotDomain);
    }

    async findLotsByPurchaseDetailIds(purchaseDetailIds, companyId) {
        if (!purchaseDetailIds || purchaseDetailIds.length === 0) return [];
        const docs = await InventoryLotModel.find({
            purchaseDetail: { $in: purchaseDetailIds },
            company: companyId,
        });
        return docs.map(toLotDomain);
    }

    async updateLotCost(lotId, { unitCost, totalCost }) {
        assertValidId(lotId);
        const doc = await InventoryLotModel.findByIdAndUpdate(
            lotId,
            { unitCost, totalCost },
            { new: true, runValidators: true },
        );
        return toLotDomain(doc);
    }

    // Transacción Mongo (Atlas corre siempre como replica set): las 4
    // escrituras del ERS 6.9.19 se confirman juntas o ninguna. Primer uso de
    // sesiones en este codebase — ver justificación en el plan de
    // implementación (RN-INV-007 vuelve irreversible una falla parcial acá,
    // a diferencia del resto de flujos multi-write de la app).
    async assignLotToLocation({ lot, location, warehouse, quantity, company, user, referenceType, referenceId }) {
        const session = await mongoose.startSession();
        try {
            let updatedLot;

            await session.withTransaction(async () => {
                const unitCost = lot.unitCost;
                const totalCost = round2(unitCost * quantity);

                await InventoryMovementModel.create(
                    [
                        {
                            product: lot.product?._id || lot.product,
                            inventoryLot: lot.id,
                            warehouse,
                            location,
                            movementType: 'entry',
                            movementDate: new Date(),
                            quantityIn: quantity,
                            quantityOut: 0,
                            unitCost,
                            totalCost,
                            referenceType,
                            referenceId,
                            user,
                        },
                    ],
                    { session },
                );

                await InventoryLocationDetailModel.findOneAndUpdate(
                    { inventoryLot: lot.id, location },
                    { $inc: { quantity } },
                    { upsert: true, new: true, session },
                );

                const existingAverage = await InventoryCostAverageModel.findOne({ company, product: lot.product?._id || lot.product }).session(session);
                const previousQty = existingAverage?.quantityOnHand || 0;
                const previousValue = existingAverage?.inventoryValue || 0;
                const newQty = previousQty + quantity;
                const newValue = round2(previousValue + totalCost);
                const newAverageCost = newQty > 0 ? round2(newValue / newQty) : 0;

                await InventoryCostAverageModel.findOneAndUpdate(
                    { company, product: lot.product?._id || lot.product },
                    { quantityOnHand: newQty, inventoryValue: newValue, averageUnitCost: newAverageCost },
                    { upsert: true, session },
                );

                const newQuantityAssigned = round2(lot.quantityAssigned + quantity);
                const newStatus = newQuantityAssigned >= lot.quantityReceived ? 'placed' : 'partially_placed';

                const lotDoc = await InventoryLotModel.findByIdAndUpdate(
                    lot.id,
                    { quantityAssigned: newQuantityAssigned, status: newStatus },
                    { new: true, runValidators: true, session },
                );
                updatedLot = toLotDomain(lotDoc);
            });

            return updatedLot;
        } finally {
            await session.endSession();
        }
    }

    async getLocationStock(locationId) {
        const result = await InventoryLocationDetailModel.aggregate([
            { $match: { location: new mongoose.Types.ObjectId(locationId) } },
            { $group: { _id: null, stock: { $sum: '$quantity' } } },
        ]);
        return result[0]?.stock ?? 0;
    }

    async getLotQuantityAtLocation(lotId, locationId) {
        const detail = await InventoryLocationDetailModel.findOne({ inventoryLot: lotId, location: locationId });
        return detail?.quantity ?? 0;
    }

    async recordTransferLeg({ lot, fromWarehouse, toWarehouse, fromLocation, toLocation, quantity, company, user, referenceId }) {
        const session = await mongoose.startSession();
        try {
            let movements;

            await session.withTransaction(async () => {
                const unitCost = lot.unitCost;
                const totalCost = round2(unitCost * quantity);
                const product = lot.product?._id || lot.product;

                movements = await InventoryMovementModel.create(
                    [
                        {
                            product,
                            inventoryLot: lot.id,
                            warehouse: fromWarehouse,
                            location: fromLocation,
                            movementType: 'transfer',
                            movementDate: new Date(),
                            quantityIn: 0,
                            quantityOut: quantity,
                            unitCost,
                            totalCost,
                            referenceType: 'transfer',
                            referenceId,
                            user,
                        },
                        {
                            product,
                            inventoryLot: lot.id,
                            warehouse: toWarehouse,
                            location: toLocation,
                            movementType: 'transfer',
                            movementDate: new Date(),
                            quantityIn: quantity,
                            quantityOut: 0,
                            unitCost,
                            totalCost,
                            referenceType: 'transfer',
                            referenceId,
                            user,
                        },
                    ],
                    // Mongoose exige `ordered: true` explícito al crear varios
                    // documentos dentro de una sesión transaccional.
                    { session, ordered: true },
                );

                await InventoryLocationDetailModel.findOneAndUpdate(
                    { inventoryLot: lot.id, location: fromLocation },
                    { $inc: { quantity: -quantity } },
                    { session },
                );

                await InventoryLocationDetailModel.findOneAndUpdate(
                    { inventoryLot: lot.id, location: toLocation },
                    { $inc: { quantity } },
                    { upsert: true, session },
                );
                // RN-INV-015: un traslado nunca toca inventory_cost_averages —
                // el costo promedio es global por empresa+producto y no cambia
                // por mover mercancía de una ubicación/almacén a otro.
            });

            return movements;
        } finally {
            await session.endSession();
        }
    }

    async recordInventoryAdjustment({ lot, warehouse, location, quantity, referenceId, user }) {
        const session = await mongoose.startSession();
        try {
            let movement;

            await session.withTransaction(async () => {
                const unitCost = lot.unitCost;
                const totalCost = round2(unitCost * quantity);

                [movement] = await InventoryMovementModel.create(
                    [
                        {
                            product: lot.product?._id || lot.product,
                            inventoryLot: lot.id,
                            warehouse,
                            location,
                            movementType: 'adjustment',
                            movementDate: new Date(),
                            quantityIn: 0,
                            quantityOut: quantity,
                            unitCost,
                            totalCost,
                            referenceType: 'adjustment',
                            referenceId,
                            user,
                        },
                    ],
                    { session },
                );

                await InventoryLocationDetailModel.findOneAndUpdate(
                    { inventoryLot: lot.id, location },
                    { $inc: { quantity: -quantity } },
                    { session },
                );
            });

            return movement;
        } finally {
            await session.endSession();
        }
    }

    async findMovements({ location, product, inventoryLot, warehouse, movementType, dateFrom, dateTo, page = 1, limit = 20 } = {}) {
        const filter = {};
        if (location) filter.location = location;
        if (product) filter.product = product;
        if (inventoryLot) filter.inventoryLot = inventoryLot;
        if (warehouse) filter.warehouse = warehouse;
        if (movementType) filter.movementType = movementType;
        if (dateFrom || dateTo) {
            filter.movementDate = {};
            if (dateFrom) filter.movementDate.$gte = new Date(dateFrom);
            if (dateTo) filter.movementDate.$lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            InventoryMovementModel.find(filter).populate(MOVEMENT_POPULATE).sort({ movementDate: -1 }).skip(skip).limit(limit),
            InventoryMovementModel.countDocuments(filter),
        ]);

        return { items: docs.map(toMovementDomain), total };
    }
}
