import { buildExcelWorkbook } from '../reports/excelLogReport.js';
import { streamPdfReport } from '../reports/pdfLogReport.js';

const toLogDTO = (entry) => ({
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
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    statusCode: entry.statusCode,
    createdAt: entry.createdAt,
});

export class LogController {
    constructor({ listLogs, listLogsForExport, deleteAllLogs }) {
        this.listLogsUseCase = listLogs;
        this.listLogsForExportUseCase = listLogsForExport;
        this.deleteAllLogsUseCase = deleteAllLogs;
    }

    getAll = async (req, res) => {
        try {
            const { user, action, resource, startDate, endDate, page = 1, limit = 10 } = req.query;
            const result = await this.listLogsUseCase.execute({ company: req.user.companyId, user, action, resource, startDate, endDate, page, limit });

            res.status(200).json({
                data: result.items.map(toLogDTO),
                total: result.total,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalRecords: result.total,
                    limit: result.limit,
                    hasNextPage: result.page < result.totalPages,
                    hasPrevPage: result.page > 1,
                },
            });
        } catch (error) {
            console.error('Error en logsReports:', error);
            res.status(500).json({
                msj: 'Error al obtener logs',
                error: error.message,
            });
        }
    };

    exportExcel = async (req, res) => {
        try {
            const { user, action, resource, startDate, endDate, exportAll = 'true', page = 1, limit = 10 } = req.query;
            const logs = await this.listLogsForExportUseCase.execute({ company: req.user.companyId, user, action, resource, startDate, endDate, exportAll, page, limit });

            const buffer = await buildExcelWorkbook(logs.map(toLogDTO), { action, resource, startDate, endDate, exportAll, page });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=logs_${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            console.error('Error generando Excel:', error);
            res.status(500).json({
                msj: 'Error generando reporte Excel',
                error: error.message,
            });
        }
    };

    exportPdf = async (req, res) => {
        try {
            const { user, action, resource, startDate, endDate, exportAll = 'true', page = 1, limit = 10 } = req.query;
            const logs = await this.listLogsForExportUseCase.execute({ company: req.user.companyId, user, action, resource, startDate, endDate, exportAll, page, limit });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=logs_${Date.now()}.pdf`);
            streamPdfReport(logs.map(toLogDTO), { action, resource, startDate, endDate, exportAll, page }, res);
        } catch (error) {
            console.error('Error generando PDF:', error);
            res.status(500).json({
                msj: 'Error generando reporte PDF',
                error: error.message,
            });
        }
    };

    deleteAll = async (req, res) => {
        try {
            const result = await this.deleteAllLogsUseCase.execute({ company: req.user.companyId });

            res.status(200).json({
                msj: 'Logs eliminados correctamente',
                deletedCount: result.deletedCount,
            });
        } catch (error) {
            console.error('Error eliminando logs:', error);
            res.status(500).json({
                msj: 'Error al eliminar logs',
                error: error.message,
            });
        }
    };
}
