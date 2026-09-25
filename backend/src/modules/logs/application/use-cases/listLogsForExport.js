const MAX_EXPORT_RECORDS = 1000;

export class ListLogsForExportUseCase {
  constructor(logRepository) {
    this.logRepository = logRepository;
  }

  async execute({ company, user, action, resource, startDate, endDate, exportAll = 'true', page = 1, limit = 10 } = {}) {
    const criteria = { company, user, action, resource, startDate, endDate };

    if (exportAll === 'false' || exportAll === false) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const { items } = await this.logRepository.findAll({ ...criteria, skip, limit: limitNum });
      return items;
    }

    const { items } = await this.logRepository.findAll({ ...criteria, skip: 0, limit: MAX_EXPORT_RECORDS });
    return items;
  }
}
