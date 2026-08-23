import { fetchEntitySnapshot, toPlainValue } from '#shared/lib/entitySnapshot.js';
import { diffFields } from '#shared/lib/objectDiff.js';
import { MongoLogRepository } from '../persistence/MongoLogRepository.js';
import { WriteLogEntryUseCase } from '../../application/use-cases/writeLogEntry.js';

const writeLogEntryUseCase = new WriteLogEntryUseCase(new MongoLogRepository());

/**
 * Middleware genérico de auditoría. No conoce el shape de ninguna entidad en
 * particular: recibe el modelo de mongoose y la configuración de snapshot/comparación
 * por parámetro, así puede reutilizarse para usuarios, empresas, roles, etc.
 * Es el único punto de escritura de la bitácora fuera del propio módulo logs.
 *
 * @param {Object} config
 * @param {'create'|'update'|'delete'|'read'} config.action
 * @param {string} config.resource - nombre del recurso para la bitácora (ej. 'users')
 * @param {import('mongoose').Model} config.entityModel - modelo mongoose de la entidad afectada
 * @param {Object} [config.snapshot] - { fields, populate, transform } usados para el "antes"
 * @param {string} [config.responseKey] - clave del body de respuesta donde viene la entidad (ej. 'newUser')
 * @param {string[]} [config.compareFields] - campos a comparar para calcular changedFields
 * @param {(entity: Object) => (string|Promise<string>)} [config.resolveEntityName] - obtiene el
 *   nombre human-readable de la entidad para "Registro afectado". Por defecto usa `entity.name`,
 *   que solo existe en algunos modelos: los módulos cuya entidad no tiene ese campo (ej. locations,
 *   product-images) deben pasar su propio resolver.
 */
export const logAction = ({
    action,
    resource,
    entityModel,
    snapshot: { fields = [], populate = null, transform = null } = {},
    responseKey = null,
    compareFields = fields,
    resolveEntityName = (entity) => entity.name,
}) => {
    return async (req, res, next) => {
        let dataBefore = null;

        if (req.params.id && (action === 'update' || action === 'delete')) {
            dataBefore = await fetchEntitySnapshot(entityModel, req.params.id, { fields, populate, transform });
        }

        const originalJson = res.json;

        res.json = async function (data) {
            if (req.user) {
                const entity = responseKey ? data?.[responseKey] : null;

                const logData = {
                    user: req.user.id,
                    action,
                    resource,
                    details: `${req.method} ${req.originalUrl}`,
                    userAgent: req.get('user-agent'),
                    statusCode: res.statusCode,
                    dataBefore,
                };

                if (entity) {
                    logData.entityId = entity.id;
                    logData.entityModel = entityModel.modelName;
                    logData.entityName = await resolveEntityName(entity);
                    logData.dataAfter = action === 'delete'
                        ? null
                        : fields.reduce((snapshot, field) => {
                            snapshot[field] = toPlainValue(entity[field]);
                            return snapshot;
                        }, {});

                    if (action === 'update') {
                        logData.changedFields = diffFields(dataBefore, logData.dataAfter, compareFields);
                    }
                } else if (dataBefore) {
                    // No vino entidad en la respuesta (ej. delete sin payload): usamos el snapshot previo
                    logData.entityId = req.params.id;
                    logData.entityModel = entityModel.modelName;
                }

                try {
                    await writeLogEntryUseCase.execute(logData);
                } catch (error) {
                    console.error('Error creating log:', error);
                }
            }

            return originalJson.call(this, data);
        };

        next();
    };
};
