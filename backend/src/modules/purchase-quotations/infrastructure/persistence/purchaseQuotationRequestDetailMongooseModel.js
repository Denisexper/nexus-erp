import { Schema, model } from 'mongoose';

// Trazabilidad a nivel de línea (Regla 4 del ERS): de qué línea de qué
// solicitud sale cada porción de cantidad consolidada en una línea de
// cotización. Se llena sola al crear la cotización; no tiene CRUD propio.
const purchaseQuotationRequestDetailSchema = new Schema({
    purchaseQuotationDetail: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotationDetail',
        required: true
    },
    purchaseRequestDetail: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseRequestDetail',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [0.01, 'La cantidad debe ser mayor que cero']
    }
}, {
    timestamps: true
});

export const PurchaseQuotationRequestDetailModel = model('PurchaseQuotationRequestDetail', purchaseQuotationRequestDetailSchema);
