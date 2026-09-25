import { Schema, model } from 'mongoose';

//eschema para la bitacora (logs que se requiere)
const logSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userModel'
    },
    action: {
        type: String,
        enum: ['login', 'logout', 'create', 'update', 'delete', 'read']
    },
    resource: {
        type: String
    },
    // Entidad afectada por la acción (usuario, producto, rol, etc.)
    entityId: {
        type: Schema.Types.ObjectId,
        // refPath permite popular dinámicamente según el modelo indicado en entityModel
        refPath: 'entityModel',
        default: null
    },
    // Nombre del modelo de mongoose al que pertenece entityId ('userModel', 'Product', etc.)
    entityModel: {
        type: String,
        default: null
    },
    entityName: {
        type: String,
        default: null
    },
    // Snapshot del objeto ANTES de la acción
    dataBefore: {
        type: Schema.Types.Mixed,
        default: null
    },
    // Snapshot del objeto DESPUÉS de la acción
    dataAfter: {
        type: Schema.Types.Mixed,
        default: null
    },
    // Lista de campos que cambiaron
    changedFields: [{
        type: String
    }],
    details: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    statusCode: {
        type: Number
    }
}, { timestamps: true });

export const LogModel = model('Log', logSchema);
