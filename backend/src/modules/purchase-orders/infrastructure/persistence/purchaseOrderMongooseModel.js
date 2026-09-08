import { Schema, model } from 'mongoose';
import { PURCHASE_ORDER_STATUSES } from '../../domain/PurchaseOrder.js';

const purchaseOrderSchema = new Schema({
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
    purchaseQuotation: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotation',
        required: [true, 'La cotización de origen es obligatoria']
    },
    orderDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expectedDate: {
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
        enum: PURCHASE_ORDER_STATUSES,
        default: 'draft'
    },
    notes: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        // Nombre de modelo real es 'userModel', no 'User' (ver comentario en
        // userMongooseModel.js) — mismo criterio que purchase-quotations.
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio']
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global.
purchaseOrderSchema.index({ company: 1, code: 1 }, { unique: true });

export const PurchaseOrderModel = model('PurchaseOrder', purchaseOrderSchema);
