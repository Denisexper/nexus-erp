import { MongoLogRepository } from '../persistence/MongoLogRepository.js';
import { GetEntityHistoryUseCase } from '../../application/use-cases/getEntityHistory.js';

const getEntityHistoryUseCase = new GetEntityHistoryUseCase(new MongoLogRepository());

const toHistoryDTO = (entry) => ({
    _id: entry.id,
    id: entry.id,
    user: entry.user,
    action: entry.action,
    resource: entry.resource,
    entityId: entry.entityId,
    entityModel: entry.entityModel,
    entityName: entry.entityName,
    dataBefore: entry.dataBefore,
    dataAfter: entry.dataAfter,
    changedFields: entry.changedFields,
    details: entry.details,
    createdAt: entry.createdAt,
});

// Historial de cambios de una entidad. Factory reutilizable para cualquier
// módulo (usuarios, empresas, roles, etc.): cada ruta define su propio
// entityModel (modelName) y el nombre del param de la URL donde viene el id.
export const createEntityHistoryHandler = (entityModel, paramName = 'id') => {
    return async (req, res) => {
        try {
            const entityId = req.params[paramName];
            const logs = await getEntityHistoryUseCase.execute({ company: req.user.companyId, entityId, entityModel });

            res.status(200).json({
                msj: 'Historial obtenido',
                total: logs.length,
                data: logs.map(toHistoryDTO),
            });
        } catch (error) {
            res.status(500).json({
                msj: 'Error obteniendo historial',
                error: error.message,
            });
        }
    };
};
