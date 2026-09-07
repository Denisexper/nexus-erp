import { Schema, model } from 'mongoose';

const purchaseQuotationExpenseSchema = new Schema({
    purchaseQuotation: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseQuotation',
        required: [true, 'La cotización de compra es obligatoria']
    },
    expenseType: {
        type: Schema.Types.ObjectId,
        ref: 'ExpenseType',
        required: [true, 'El tipo de gasto es obligatorio']
    },
    description: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'El monto es obligatorio'],
        min: [0, 'El monto no puede ser negativo']
    }
}, {
    timestamps: true
});

export const PurchaseQuotationExpenseModel = model('PurchaseQuotationExpense', purchaseQuotationExpenseSchema);
