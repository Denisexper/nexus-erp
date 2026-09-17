import { Schema, model } from 'mongoose';

const purchaseDetailSchema = new Schema({
    purchase: {
        type: Schema.Types.ObjectId,
        ref: 'Purchase',
        required: [true, 'La compra es obligatoria']
    },
    purchaseOrderDetail: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseOrderDetail',
        required: [true, 'La línea de orden de origen es obligatoria']
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio']
    },
    quantityOrdered: {
        type: Number,
        required: [true, 'La cantidad ordenada es obligatoria'],
        min: [0.01, 'La cantidad ordenada debe ser mayor que cero']
    },
    quantityReceived: {
        type: Number,
        required: [true, 'La cantidad recibida es obligatoria'],
        min: [0.01, 'La cantidad recibida debe ser mayor que cero']
    },
    unit: {
        type: Schema.Types.ObjectId,
        ref: 'Unit',
        required: [true, 'La unidad es obligatoria']
    },
    unitPrice: {
        type: Number,
        required: [true, 'El precio unitario es obligatorio'],
        min: [0, 'El precio unitario no puede ser negativo']
    },
    discount: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    taxRate: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const PurchaseDetailModel = model('PurchaseDetail', purchaseDetailSchema);
