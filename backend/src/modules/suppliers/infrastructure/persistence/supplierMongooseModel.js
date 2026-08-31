import { Schema, model } from 'mongoose';

const supplierSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    code: {
        type: String,
        required: [true, 'El código del proveedor es obligatorio'],
        trim: true
    },
    country: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'El país es obligatorio']
    },
    name: {
        type: String,
        required: [true, 'El nombre del proveedor es obligatorio'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email no válido']
    },
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/\S+\.\S+$/, 'Sitio web no válido']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global (RN-SUP-002 + tenant scoping).
supplierSchema.index({ company: 1, code: 1 }, { unique: true });

export const SupplierModel = model('Supplier', supplierSchema);
