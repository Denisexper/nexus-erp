import { Schema, model } from 'mongoose';

// Tabla puente N:M (Regla 2/3 del ERS): una cotización puede consolidar
// varias solicitudes, y una solicitud puede cotizarse con varios
// proveedores. Se llena sola al crear la cotización (ver
// createPurchaseQuotation.js); no tiene CRUD propio.
const purchaseQuotationRequestSchema = new Schema({
    purchaseQuotation: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotation',
        required: true
    },
    purchaseRequest: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseRequest',
        required: true
    }
}, {
    timestamps: true
});

purchaseQuotationRequestSchema.index({ purchaseQuotation: 1, purchaseRequest: 1 }, { unique: true });

export const PurchaseQuotationRequestModel = model('PurchaseQuotationRequest', purchaseQuotationRequestSchema);
