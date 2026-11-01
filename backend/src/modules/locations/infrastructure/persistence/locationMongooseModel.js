import { Schema, model } from 'mongoose';

const locationSchema = new Schema({
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'El almacén es obligatorio']
    },
    code: {
        type: String,
        required: [true, 'El código de ubicación es obligatorio'],
        trim: true
    },
    aisle: { type: String, trim: true, default: '' },
    rack: { type: String, trim: true, default: '' },
    level: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
    capacity: {
        type: Number,
        required: [true, 'La capacidad es obligatoria'],
        min: [1, 'La capacidad debe ser mayor que cero']
    },
    // ERS v1.0 6.9.19: ubicación de tránsito para traslados entre almacenes
    // (ej. "Camión 1"). Aditivo: los documentos existentes caen en 'storage'
    // por el default, sin necesidad de migración.
    type: {
        type: String,
        enum: ['storage', 'vehicle'],
        default: 'storage'
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// RN-WHS-006: código único dentro del almacén (no global).
locationSchema.index({ warehouse: 1, code: 1 }, { unique: true });
// RN-WHS-009: no duplicar pasillo-estante-nivel-posición dentro del mismo almacén.
// aisle/rack/level/position son opcionales (default ''), así que el índice
// nunca choca con el "hueco" típico de Mongo entre múltiples `null`.
locationSchema.index({ warehouse: 1, aisle: 1, rack: 1, level: 1, position: 1 }, { unique: true });

export const LocationModel = model('Location', locationSchema);
