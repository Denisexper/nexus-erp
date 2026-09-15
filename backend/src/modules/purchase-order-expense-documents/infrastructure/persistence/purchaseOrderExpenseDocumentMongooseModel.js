import { Schema, model } from 'mongoose';

const purchaseOrderExpenseDocumentSchema = new Schema({
    purchaseOrderExpense: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseOrderExpense',
        required: [true, 'El gasto asociado es obligatorio']
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

export const PurchaseOrderExpenseDocumentModel = model('PurchaseOrderExpenseDocument', purchaseOrderExpenseDocumentSchema);
