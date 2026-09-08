import { Schema, model } from 'mongoose';

const purchaseRequestDetailSchema = new Schema({
    purchaseRequest: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseRequest',
        required: [true, 'La solicitud de compra es obligatoria']
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
    description: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const PurchaseRequestDetailModel = model('PurchaseRequestDetail', purchaseRequestDetailSchema);
