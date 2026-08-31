import { Schema, model } from 'mongoose';

const productSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
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
        trim: true
    },
    originalCode: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        trim: true
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

// RN-PRO-005/004: código interno y SKU únicos dentro de la misma empresa,
// no global (igual que branches/categories). `sparse` no sirve acá: en un
// índice compuesto solo excluye el documento si TODOS los campos del índice
// faltan, y `company` siempre está presente. Se usa partialFilterExpression
// en su lugar, que sí excluye por campo puntual — necesario para el SKU
// (RN-PRO-004 solo aplica "cuando se proporciona") y como red de seguridad
// en internalCode por si algún documento legado quedó sin el campo.
productSchema.index(
    { company: 1, internalCode: 1 },
    { unique: true, partialFilterExpression: { internalCode: { $exists: true } } },
);
productSchema.index(
    { company: 1, sku: 1 },
    { unique: true, partialFilterExpression: { sku: { $exists: true } } },
);

export const ProductModel = model('Product', productSchema);
