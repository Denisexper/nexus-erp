import { Schema, model } from 'mongoose';

const inventoryTransferDetailSchema = new Schema({
    inventoryTransfer: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransfer',
        required: [true, 'El traslado es obligatorio'],
    },
    inventoryLot: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryLot',
        required: [true, 'El lote es obligatorio'],
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio'],
    },
    sourceLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'La ubicación de origen es obligatoria'],
    },
    destinationLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'La ubicación de destino es obligatoria'],
    },
    quantityDispatched: {
        type: Number,
        required: [true, 'La cantidad despachada es obligatoria'],
        min: [0.01, 'La cantidad debe ser mayor que cero'],
    },
    quantityReceived: {
        type: Number,
        default: null,
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: false,
});

inventoryTransferDetailSchema.index({ inventoryTransfer: 1 });

export const InventoryTransferDetailModel = model('InventoryTransferDetail', inventoryTransferDetailSchema);
