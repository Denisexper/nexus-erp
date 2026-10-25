import mongoose from 'mongoose';
import { PurchaseQuotationDocumentRepository } from '../../domain/PurchaseQuotationDocumentRepository.js';
import { PurchaseQuotationDocument } from '../../domain/PurchaseQuotationDocument.js';
import { InvalidPurchaseQuotationDocumentIdError } from '../../domain/errors.js';
import { PurchaseQuotationDocumentModel } from './purchaseQuotationDocumentMongooseModel.js';

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidPurchaseQuotationDocumentIdError();
    }
};

const toDomain = (doc) =>
    doc
        ? new PurchaseQuotationDocument({
              id: doc._id.toString(),
              purchaseQuotation: doc.purchaseQuotation,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              uploadedAt: doc.uploadedAt,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

export class MongoPurchaseQuotationDocumentRepository extends PurchaseQuotationDocumentRepository {
    async findAllByQuotation(purchaseQuotationId) {
        const docs = await PurchaseQuotationDocumentModel.find({ purchaseQuotation: purchaseQuotationId }).sort({ createdAt: -1 });
        return docs.map(toDomain);
    }

    async findById(id) {
        assertValidId(id);
        const doc = await PurchaseQuotationDocumentModel.findById(id);
        return toDomain(doc);
    }

    async create(document) {
        const doc = await PurchaseQuotationDocumentModel.create({
            purchaseQuotation: document.purchaseQuotation,
            fileName: document.fileName,
            filePath: document.filePath,
            fileType: document.fileType,
        });
        return toDomain(doc);
    }

    async delete(id) {
        assertValidId(id);
        const doc = await PurchaseQuotationDocumentModel.findByIdAndDelete(id);
        return toDomain(doc);
    }
}
