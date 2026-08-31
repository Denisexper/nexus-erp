import { Schema, model } from 'mongoose';

const unitSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    name: {
        type: String,
        required: [true, 'El nombre de la unidad es obligatorio'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'El tipo de la unidad es obligatorio'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Nombre único dentro de la misma empresa, no global (igual que branches/categories).
unitSchema.index({ company: 1, name: 1 }, { unique: true });

export const UnitModel = model('Unit', unitSchema);
