import { Schema, model } from 'mongoose';
import { RETACEO_STATUSES } from '../../domain/Retaceo.js';

const retaceoSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    code: {
        type: String,
        required: [true, 'El código es obligatorio'],
        trim: true
    },
    purchaseOrder: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseOrder',
        required: [true, 'La orden de compra de origen es obligatoria']
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'El proveedor es obligatorio']
    },
    retaceoDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    originCountry: {
        type: String,
        trim: true
    },
    importInvoiceNumber: {
        type: String,
        trim: true
    },
    importInvoiceDate: {
        type: Date
    },
    importPolicyNumber: {
        type: String,
        trim: true
    },
    importPolicyDate: {
        type: Date
    },
    totalFob: {
        type: Number,
        default: 0
    },
    totalFreight: {
        type: Number,
        default: 0
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    totalDai: {
        type: Number,
        default: 0
    },
    totalCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: RETACEO_STATUSES,
        default: 'registered'
    },
    notes: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        // Nombre de modelo real es 'userModel', mismo criterio que
        // purchase-orders/purchase-quotations.
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio']
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global.
retaceoSchema.index({ company: 1, code: 1 }, { unique: true });
// RN de dominio (PurchaseOrderAlreadyRetaceadoError): una orden solo puede
// tener un retaceo. Se refuerza también a nivel de índice, no solo en el
// use case.
retaceoSchema.index({ company: 1, purchaseOrder: 1 }, { unique: true });

export const RetaceoModel = model('Retaceo', retaceoSchema);
