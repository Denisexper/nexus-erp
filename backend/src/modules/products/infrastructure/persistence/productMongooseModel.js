import { Schema, model } from 'mongoose';

const productSchema = new Schema({
    subCategory: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: [true, 'La sub-categoría es obligatoria']
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoría es obligatoria']
    },
    purchaseUnit: {
        type: Schema.Types.ObjectId,
        ref: 'Unit',
        required: [true, 'La unidad de compra es obligatoria']
    },
    saleUnit: {
        type: Schema.Types.ObjectId,
        ref: 'Unit',
        required: [true, 'La unidad de venta es obligatoria']
    },
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    internalCode: {
        type: String,
        required: [true, 'El código interno del producto es obligatorio'],
        unique: true,
        trim: true
    },
    originalCode: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },
    size: {
        type: String,
        trim: true
    },
    dimensions: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    presentation: {
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

export const ProductModel = model('Product', productSchema);
