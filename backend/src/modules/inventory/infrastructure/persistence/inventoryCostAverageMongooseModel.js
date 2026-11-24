import { Schema, model } from 'mongoose';

const inventoryCostAverageSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria'],
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio'],
    },
    quantityOnHand: {
        type: Number,
        default: 0,
    },
    inventoryValue: {
        type: Number,
        default: 0,
    },
    averageUnitCost: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: { createdAt: false, updatedAt: true },
});

// Costo promedio ponderado GLOBAL por empresa+producto, no por almacén (RN-INV-013).
inventoryCostAverageSchema.index({ company: 1, product: 1 }, { unique: true });

export const InventoryCostAverageModel = model('InventoryCostAverage', inventoryCostAverageSchema);
