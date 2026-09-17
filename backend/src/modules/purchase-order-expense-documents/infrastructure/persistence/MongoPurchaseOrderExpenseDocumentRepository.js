import mongoose from 'mongoose';
import { PurchaseOrderExpenseDocumentRepository } from '../../domain/PurchaseOrderExpenseDocumentRepository.js';
import { PurchaseOrderExpenseDocument } from '../../domain/PurchaseOrderExpenseDocument.js';
import { InvalidPurchaseOrderExpenseDocumentIdError } from '../../domain/errors.js';
import { PurchaseOrderExpenseDocumentModel } from './purchaseOrderExpenseDocumentMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseOrderExpenseDocumentIdError();
    }
};

const toDomain = (doc) =>
    doc
        ? new PurchaseOrderExpenseDocument({
              id: doc._id.toString(),
              purchaseOrderExpense: doc.purchaseOrderExpense,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              uploadedAt: doc.uploadedAt,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoPurchaseOrderExpenseDocumentRepository extends PurchaseOrderExpenseDocumentRepository {
    async findAllByExpense(purchaseOrderExpenseId) {
        const docs = await PurchaseOrderExpenseDocumentModel.find({ purchaseOrderExpense: purchaseOrderExpenseId }).sort({ createdAt: -1 });
        return docs.map(toDomain);
    }

    async findById(id) {
        assertValidId(id);
        const doc = await PurchaseOrderExpenseDocumentModel.findById(id);
        return toDomain(doc);
    }

    async create(document) {
        const doc = await PurchaseOrderExpenseDocumentModel.create({
            purchaseOrderExpense: document.purchaseOrderExpense,
            fileName: document.fileName,
            filePath: document.filePath,
            fileType: document.fileType,
        });
        return toDomain(doc);
    }

    async delete(id) {
        assertValidId(id);
        const doc = await PurchaseOrderExpenseDocumentModel.findByIdAndDelete(id);
        return toDomain(doc);
    }
}
