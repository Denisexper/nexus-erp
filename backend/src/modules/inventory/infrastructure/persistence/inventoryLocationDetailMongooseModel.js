import { Schema, model } from 'mongoose';

const inventoryLocationDetailSchema = new Schema({
    inventoryLot: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryLot',
        required: [true, 'El lote es obligatorio'],
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'La ubicación es obligatoria'],
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: { createdAt: false, updatedAt: true },
});

// Un único saldo por (lote, ubicación) — ERS 6.9.6.
inventoryLocationDetailSchema.index({ inventoryLot: 1, location: 1 }, { unique: true });
inventoryLocationDetailSchema.index({ location: 1 });

export const InventoryLocationDetailModel = model('InventoryLocationDetail', inventoryLocationDetailSchema);
