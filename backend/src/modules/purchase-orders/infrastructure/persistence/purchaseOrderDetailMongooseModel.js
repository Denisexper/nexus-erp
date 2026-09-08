import { Schema, model } from 'mongoose';

const purchaseOrderDetailSchema = new Schema({
    purchaseOrder: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseOrder',
        required: [true, 'La orden de compra es obligatoria']
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
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const PurchaseOrderDetailModel = model('PurchaseOrderDetail', purchaseOrderDetailSchema);
