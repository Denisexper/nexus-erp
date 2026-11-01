import { Schema, model } from 'mongoose';
import { INVENTORY_MOVEMENT_TYPES, INVENTORY_MOVEMENT_REFERENCE_TYPES } from '../../domain/InventoryMovement.js';

// Append-only (RN-INV-007): no updatedAt, nunca se edita ni se borra.
const inventoryMovementSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio'],
    },
    inventoryLot: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryLot',
        required: [true, 'El lote es obligatorio'],
    },
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'El almacén es obligatorio'],
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
    },
    movementType: {
        type: String,
        enum: INVENTORY_MOVEMENT_TYPES,
        required: [true, 'El tipo de movimiento es obligatorio'],
    },
    movementDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    quantityIn: {
        type: Number,
        default: 0,
        min: 0,
    },
    quantityOut: {
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
    referenceType: {
        type: String,
        enum: INVENTORY_MOVEMENT_REFERENCE_TYPES,
        required: [true, 'El tipo de documento de origen es obligatorio'],
    },
    referenceId: {
        type: Schema.Types.ObjectId,
        required: [true, 'El documento de origen es obligatorio'],
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio'],
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

inventoryMovementSchema.index({ product: 1 });
inventoryMovementSchema.index({ inventoryLot: 1 });
inventoryMovementSchema.index({ warehouse: 1 });
inventoryMovementSchema.index({ location: 1 });
inventoryMovementSchema.index({ referenceType: 1, referenceId: 1 });

export const InventoryMovementModel = model('InventoryMovement', inventoryMovementSchema);
