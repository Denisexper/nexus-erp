import { Schema, model } from 'mongoose';

// Append-only (igual criterio que inventory_movements): una impresión o
// reimpresión queda registrada para siempre, no se edita ni se borra.
const inventoryLabelPrintSchema = new Schema({
    inventoryLot: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryLot',
        required: [true, 'El lote es obligatorio'],
    },
    quantityPrinted: {
        type: Number,
        required: [true, 'La cantidad de etiquetas impresas es obligatoria'],
        min: [1, 'La cantidad debe ser mayor que cero'],
    },
    printDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio'],
    },
    reprintReason: {
        type: String,
        trim: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

inventoryLabelPrintSchema.index({ inventoryLot: 1 });

export const InventoryLabelPrintModel = model('InventoryLabelPrint', inventoryLabelPrintSchema);
