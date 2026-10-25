import { Schema, model } from 'mongoose';

const purchaseQuotationDocumentSchema = new Schema({
    purchaseQuotation: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotation',
        required: [true, 'La cotización asociada es obligatoria']
    },
    fileName: {
        type: String,
        required: [true, 'El nombre del archivo es obligatorio']
    },
    filePath: {
        type: String,
        required: [true, 'La ruta del archivo es obligatoria']
    },
    fileType: {
        type: String,
        required: [true, 'El tipo de archivo es obligatorio']
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const PurchaseQuotationDocumentModel = model('PurchaseQuotationDocument', purchaseQuotationDocumentSchema);
