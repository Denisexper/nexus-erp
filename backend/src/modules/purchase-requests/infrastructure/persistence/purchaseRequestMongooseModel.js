import { Schema, model } from 'mongoose';
import { PURCHASE_REQUEST_STATUSES } from '../../domain/PurchaseRequest.js';

const purchaseRequestSchema = new Schema({
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
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'La sucursal es obligatoria']
    },
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'El almacén es obligatorio']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio']
    },
    requestDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    requiredDate: {
        type: Date
    },
    justification: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: PURCHASE_REQUEST_STATUSES,
        default: 'draft'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global (igual que branches/categories).
purchaseRequestSchema.index({ company: 1, code: 1 }, { unique: true });

export const PurchaseRequestModel = model('PurchaseRequest', purchaseRequestSchema);
