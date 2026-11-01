import { InventoryLabelPrintRepository } from '../../domain/InventoryLabelPrintRepository.js';
import { InventoryLabelPrint } from '../../domain/InventoryLabelPrint.js';
import { InventoryLabelPrintModel } from './inventoryLabelPrintMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new InventoryLabelPrint({
              id: doc._id.toString(),
              inventoryLot: doc.inventoryLot,
              quantityPrinted: doc.quantityPrinted,
              printDate: doc.printDate,
              user: doc.user,
              reprintReason: doc.reprintReason,
              createdAt: doc.createdAt,
          })
        : null;

export class MongoInventoryLabelPrintRepository extends InventoryLabelPrintRepository {
    async findByLot(lotId) {
        const docs = await InventoryLabelPrintModel.find({ inventoryLot: lotId })
            .populate({ path: 'user', select: 'name email' })
            .sort({ createdAt: -1 });
        return docs.map(toDomain);
    }

    async countByLot(lotId) {
        return InventoryLabelPrintModel.countDocuments({ inventoryLot: lotId });
    }

    async create(labelPrint) {
        const doc = await InventoryLabelPrintModel.create({
            inventoryLot: labelPrint.inventoryLot,
            quantityPrinted: labelPrint.quantityPrinted,
            printDate: labelPrint.printDate,
            user: labelPrint.user,
            reprintReason: labelPrint.reprintReason,
        });
        return toDomain(doc);
    }
}
