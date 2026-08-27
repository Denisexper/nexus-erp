import { Schema, model } from 'mongoose';

const roleSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    name: {
        type: String,
        required: [true, 'El nombre del rol es obligatorio'],
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: [true, 'El nombre para mostrar es obligatorio'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: String,
        trim: true
    }],
    isSystem: {
        type: Boolean,
        default: false // true para roles predefinidos (admin, moderator, user)
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// El nombre del rol es único dentro de la misma empresa, no global (mismo
// patrón que branchSchema.index({company:1, name:1}) y userSchema.index
// ({company:1, email:1})): dos empresas distintas pueden tener cada una su
// propio rol "admin" sin chocar.
roleSchema.index({ company: 1, name: 1 }, { unique: true });

export const RoleModel = model('Role', roleSchema);
