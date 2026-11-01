import { Schema, model } from 'mongoose';
import { INVENTORY_LOT_STATUSES } from '../../domain/InventoryLot.js';

const inventoryLotSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria'],
    },
    lotCode: {
        type: String,
        required: [true, 'El código de lote es obligatorio'],
        trim: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio'],
    },
    purchaseDetail: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseDetail',
        required: [true, 'El detalle de recepción de origen es obligatorio'],
    },
    receivedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    quantityReceived: {
        type: Number,
        required: [true, 'La cantidad recibida es obligatoria'],
        min: [0.01, 'La cantidad recibida debe ser mayor que cero'],
    },
    quantityAssigned: {
        type: Number,
        default: 0,
        min: 0,
    },
    unitCost: {
        type: Number,
        required: [true, 'El costo unitario es obligatorio'],
        min: 0,
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: INVENTORY_LOT_STATUSES,
        default: 'pending_placement',
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

inventoryLotSchema.index({ company: 1, lotCode: 1 }, { unique: true });
inventoryLotSchema.index({ purchaseDetail: 1 });
inventoryLotSchema.index({ company: 1, status: 1 });

export const InventoryLotModel = model('InventoryLot', inventoryLotSchema);
