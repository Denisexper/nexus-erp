import { Schema, model } from 'mongoose';
import { PURCHASE_STATUSES } from '../../domain/Purchase.js';

const purchaseSchema = new Schema({
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
    purchaseDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplierInvoiceNumber: {
        type: String,
        trim: true
    },
    supplierInvoiceDate: {
        type: Date
    },
    currency: {
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
    total: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: PURCHASE_STATUSES,
        default: 'received'
    },
    notes: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        // Nombre de modelo real es 'userModel', mismo criterio que
        // purchase-orders/purchase-quotations/retaceos.
        ref: 'userModel',
        required: [true, 'El usuario es obligatorio']
    }
}, {
    timestamps: true
});

// Código único dentro de la misma empresa, no global.
purchaseSchema.index({ company: 1, code: 1 }, { unique: true });

export const PurchaseModel = model('Purchase', purchaseSchema);
