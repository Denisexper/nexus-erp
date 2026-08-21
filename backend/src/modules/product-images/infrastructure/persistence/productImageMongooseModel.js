import { Schema, model } from 'mongoose';

const productImageSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto asociado es obligatorio']
    },
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    path: {
        type: String,
        required: [true, 'La ruta de la imagen es obligatoria']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const ProductImageModel = model('ProductImage', productImageSchema);
