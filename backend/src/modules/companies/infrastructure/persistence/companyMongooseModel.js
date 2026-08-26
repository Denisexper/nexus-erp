import { Schema, model } from 'mongoose';

const companySchema = new Schema({
    name: {
        type: String,
        required: [true, 'La razón social es obligatoria'],
        trim: true
    },
    commercialName: {
        type: String,
        required: [true, 'El nombre comercial es obligatorio'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'El slug es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug no válido']
    },
    nit: {
        type: String,
        required: [true, 'El NIT es obligatorio'],
        unique: true,
        trim: true
    },
    nrc: {
        type: String,
        required: [true, 'El NRC es obligatorio'],
        unique: true,
        trim: true
    },
    commercialLine1: {
        type: String,
        trim: true
    },
    commercialLine2: {
        type: String,
        trim: true
    },
    commercialLine3: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'El departamento es obligatorio']
    },
    municipality: {
        type: Schema.Types.ObjectId,
        ref: 'Municipality',
        required: [true, 'El municipio es obligatorio']
    },
    district: {
        type: Schema.Types.ObjectId,
        ref: 'District',
        required: [true, 'El distrito es obligatorio']
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
    webSite: {
        type: String,
        trim: true
    },
    logo: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const CompanyModel = model('Company', companySchema);
