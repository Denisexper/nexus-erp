import { Schema, model } from 'mongoose';
import { PURCHASE_QUOTATION_STATUSES } from '../../domain/PurchaseQuotation.js';

const purchaseQuotationSchema = new Schema({
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
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'El proveedor es obligatorio']
    },
    quotationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    validUntil: {
        type: Date
    },
    currency: {
        type: String,
        trim: true
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    deliveryDays: {
        type: Number
    },
    subtotal: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    additionalExpenses: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: PURCHASE_QUOTATION_STATUSES,
        default: 'received'
    },
    notes: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        // Nombre de modelo real es 'userModel', no 'User' (ver comentario en
        // userMongooseModel.js) — companies.owner y logs.user ya lo usan así.
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio']
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global (igual que branches/categories).
purchaseQuotationSchema.index({ company: 1, code: 1 }, { unique: true });

export const PurchaseQuotationModel = model('PurchaseQuotation', purchaseQuotationSchema);
