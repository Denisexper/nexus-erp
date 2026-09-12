import { Schema, model } from 'mongoose';

const retaceoDetailSchema = new Schema({
    retaceo: {
        type: Schema.Types.ObjectId,
        ref: 'Retaceo',
        required: [true, 'El retaceo es obligatorio']
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
    costFob: {
        type: Number,
        required: [true, 'El costo FOB es obligatorio'],
        min: [0, 'El costo FOB no puede ser negativo']
    },
    freightAmount: {
        type: Number,
        default: 0
    },
    expenseAmount: {
        type: Number,
        default: 0
    },
    daiAmount: {
        type: Number,
        default: 0
    },
    unitCost: {
        type: Number,
        default: 0
    },
    totalCost: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const RetaceoDetailModel = model('RetaceoDetail', retaceoDetailSchema);
