import { Schema, model } from 'mongoose';

const vehicleSchema = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'El empleado responsable es obligatorio']
    },
    plate: {
        type: String,
        required: [true, 'La placa es obligatoria'],
        trim: true,
        uppercase: true,
        unique: true
    },
    brand: {
        type: String,
        required: [true, 'La marca es obligatoria'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'El modelo es obligatorio'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'El año es obligatorio']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const VehicleModel = model('Vehicle', vehicleSchema);
