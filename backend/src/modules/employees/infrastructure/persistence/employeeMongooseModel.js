import { Schema, model } from 'mongoose';

const employeeSchema = new Schema({
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'La sucursal es obligatoria']
    },
    firstName: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email no válido']
    },
    phone: {
        type: String,
        trim: true
    },
    dui: {
        type: String,
        required: [true, 'El DUI es obligatorio'],
        trim: true,
        unique: true,
        match: [/^\d{8}-\d$/, 'El DUI no tiene un formato válido (########-#)']
    },
    position: {
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

export const EmployeeModel = model('Employee', employeeSchema);
