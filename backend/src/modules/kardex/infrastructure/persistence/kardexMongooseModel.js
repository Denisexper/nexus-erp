import { Schema, model } from 'mongoose';

const kardexMovementSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio']
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'La ubicación es obligatoria']
    },
    type: {
        type: String,
        enum: ['in', 'out'],
        required: [true, 'El tipo de movimiento es obligatorio']
    },
    reason: {
        type: String,
        enum: ['purchase', 'sale', 'adjustment', 'transfer', 'return', 'initial'],
        required: [true, 'El motivo del movimiento es obligatorio']
    },
    quantity: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0.01, 'La cantidad debe ser mayor que cero']
    },
    notes: {
        type: String,
        trim: true
    },
    // Enlaza los dos movimientos (salida + entrada) que forman una misma
    // transferencia entre ubicaciones. Vacío en movimientos que no lo son.
    transferRef: {
        type: String,
    },
}, {
    // El kardex es un libro contable: es append-only, nunca se edita. No hace
    // falta updatedAt, solo la fecha en la que se registró el movimiento.
    timestamps: { createdAt: true, updatedAt: false }
});

// Consulta más frecuente: existencia/historial de un producto en una ubicación.
kardexMovementSchema.index({ product: 1, location: 1 });
kardexMovementSchema.index({ location: 1 });
kardexMovementSchema.index({ transferRef: 1 });

export const KardexMovementModel = model('KardexMovement', kardexMovementSchema);
