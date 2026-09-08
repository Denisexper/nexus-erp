import { Schema, model } from 'mongoose';

const purchaseQuotationDetailSchema = new Schema({
    purchaseQuotation: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotation',
        required: [true, 'La cotización de compra es obligatoria']
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio']
    },
    quantity: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0.01, 'La cantidad debe ser mayor que cero']
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
    deliveryDays: {
        type: Number
    },
    availableQuantity: {
        type: Number
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const PurchaseQuotationDetailModel = model('PurchaseQuotationDetail', purchaseQuotationDetailSchema);
