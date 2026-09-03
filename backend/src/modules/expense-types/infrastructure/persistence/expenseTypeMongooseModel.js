import { Schema, model } from 'mongoose';

const expenseTypeSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    name: {
        type: String,
        required: [true, 'El nombre del tipo de gasto es obligatorio'],
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

// Nombre único dentro de la misma empresa, no global (igual que categories/units).
expenseTypeSchema.index({ company: 1, name: 1 }, { unique: true });

export const ExpenseTypeModel = model('ExpenseType', expenseTypeSchema);
