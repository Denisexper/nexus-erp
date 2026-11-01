import mongoose from 'mongoose';
import { InventoryTransferRepository } from '../../domain/InventoryTransferRepository.js';
import { InventoryTransfer } from '../../domain/InventoryTransfer.js';
import { InventoryTransferDetail } from '../../domain/InventoryTransferDetail.js';
import { InvalidInventoryTransferIdError } from '../../domain/errors.js';
import { InventoryTransferModel } from './inventoryTransferMongooseModel.js';
import { InventoryTransferDetailModel } from './inventoryTransferDetailMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidInventoryTransferIdError();
    }
};

const HEADER_POPULATE = [
    { path: 'sourceWarehouse', select: 'name' },
    { path: 'destinationWarehouse', select: 'name' },
    { path: 'vehicleLocation', select: 'code warehouse' },
    { path: 'user', select: 'name email' },
];

const DETAIL_POPULATE = [
    { path: 'product', select: 'name internalCode sku' },
    { path: 'sourceLocation', select: 'code' },
    { path: 'destinationLocation', select: 'code' },
];

const toDetailDomain = (doc) =>
    new InventoryTransferDetail({
        id: doc._id.toString(),
        inventoryTransfer: doc.inventoryTransfer,
        inventoryLot: doc.inventoryLot,
        product: doc.product,
        sourceLocation: doc.sourceLocation,
        destinationLocation: doc.destinationLocation,
        quantityDispatched: doc.quantityDispatched,
        quantityReceived: doc.quantityReceived,
        unitCost: doc.unitCost,
        notes: doc.notes,
    });

const toDomain = (doc, details = []) =>
    doc
        ? new InventoryTransfer({
              id: doc._id.toString(),
              company: doc.company,
              transferCode: doc.transferCode,
              sourceWarehouse: doc.sourceWarehouse,
              destinationWarehouse: doc.destinationWarehouse,
              vehicleLocation: doc.vehicleLocation,
              transferDate: doc.transferDate,
              dispatchedAt: doc.dispatchedAt,
              receivedAt: doc.receivedAt,
              status: doc.status,
              user: doc.user,
              notes: doc.notes,
              details,
              createdAt: doc.createdAt,
          })
        : null;

export class MongoInventoryTransferRepository extends InventoryTransferRepository {
    async findAll({ company, status, page = 1, limit = 10 } = {}) {
        const filter = {};
        if (company) filter.company = company;
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            InventoryTransferModel.find(filter).populate(HEADER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            InventoryTransferModel.countDocuments(filter),
        ]);

        return { items: docs.map((doc) => toDomain(doc)), total };
    }

    async #loadDetails(transferId) {
        const docs = await InventoryTransferDetailModel.find({ inventoryTransfer: transferId }).populate(DETAIL_POPULATE);
        return docs.map(toDetailDomain);
    }

    async findById(id, companyId) {
        assertValidId(id);
        const filter = companyId ? { _id: id, company: companyId } : { _id: id };
        const doc = await InventoryTransferModel.findOne(filter).populate(HEADER_POPULATE);
        if (!doc) return null;
        const details = await this.#loadDetails(doc._id);
        return toDomain(doc, details);
    }

    async getNextCode(companyId) {
        const last = await InventoryTransferModel.findOne({ company: companyId }).sort({ transferCode: -1 }).select('transferCode');
        const lastNumber = last ? parseInt(last.transferCode.split('-')[1], 10) || 0 : 0;
        return `TRF-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create({ transfer, lines }) {
        const transferDoc = await InventoryTransferModel.create({
            company: transfer.company,
            transferCode: transfer.transferCode,
            sourceWarehouse: transfer.sourceWarehouse,
            destinationWarehouse: transfer.destinationWarehouse,
            vehicleLocation: transfer.vehicleLocation,
            transferDate: transfer.transferDate,
            status: transfer.status,
            user: transfer.user,
            notes: transfer.notes,
        });

        for (const line of lines) {
            await InventoryTransferDetailModel.create({
                inventoryTransfer: transferDoc._id,
                inventoryLot: line.inventoryLot,
                product: line.product,
                sourceLocation: line.sourceLocation,
                destinationLocation: line.destinationLocation,
                quantityDispatched: line.quantityDispatched,
                unitCost: line.unitCost,
                notes: line.notes,
            });
        }

        return this.findById(transferDoc._id.toString());
    }

    async updateStatus(id, changes) {
        assertValidId(id);
        const doc = await InventoryTransferModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).populate(HEADER_POPULATE);
        const details = await this.#loadDetails(doc._id);
        return toDomain(doc, details);
    }

    async updateDetailReceived(detailId, quantityReceived) {
        await InventoryTransferDetailModel.findByIdAndUpdate(detailId, { quantityReceived });
    }
}
