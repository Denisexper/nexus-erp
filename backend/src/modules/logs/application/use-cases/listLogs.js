export class ListLogsUseCase {
  constructor(logRepository) {
    this.logRepository = logRepository;
  }

  async execute({ company, user, action, resource, startDate, endDate, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { items, total } = await this.logRepository.findAll({
      company,
      user,
      action,
      resource,
      startDate,
      endDate,
      skip,
      limit: limitNum,
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
