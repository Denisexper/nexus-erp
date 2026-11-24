import { Schema, model } from 'mongoose';
import { INVENTORY_TRANSFER_STATUSES } from '../../domain/InventoryTransfer.js';

const inventoryTransferSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria'],
    },
    transferCode: {
        type: String,
        required: [true, 'El código de traslado es obligatorio'],
        trim: true,
    },
    sourceWarehouse: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'El almacén de origen es obligatorio'],
    },
    destinationWarehouse: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'El almacén de destino es obligatorio'],
    },
    vehicleLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'La ubicación tipo vehículo es obligatoria'],
    },
    transferDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dispatchedAt: {
        type: Date,
    },
    receivedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: INVENTORY_TRANSFER_STATUSES,
        default: 'preparing',
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio'],
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

inventoryTransferSchema.index({ company: 1, transferCode: 1 }, { unique: true });
inventoryTransferSchema.index({ company: 1, status: 1 });

export const InventoryTransferModel = model('InventoryTransfer', inventoryTransferSchema);
