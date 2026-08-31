import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    name: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        trim: true
    },
    description: {
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

// Nombre único dentro de la misma empresa, no global (igual que branches).
categorySchema.index({ company: 1, name: 1 }, { unique: true });

export const CategoryModel = model('Category', categorySchema);
