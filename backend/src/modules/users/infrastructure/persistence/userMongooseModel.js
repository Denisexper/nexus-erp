import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email no válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockedUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Email único por empresa (multi-tenant), no globalmente: el mismo correo
// puede repetirse en dos empresas distintas. Mismo patrón que
// branchSchema.index({company:1, name:1}) en branchMongooseModel.js.
userSchema.index({ company: 1, email: 1 }, { unique: true });

// El nombre de modelo 'userModel' se mantiene tal cual (no 'User') porque
// otros esquemas (companies.owner, logs.user) ya referencian ese nombre vía
// `ref: 'userModel'`.
export const UserModel = model('userModel', userSchema);
