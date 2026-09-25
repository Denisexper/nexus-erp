export class DeleteAllLogsUseCase {
  constructor(logRepository) {
    this.logRepository = logRepository;
  }

  async execute({ company }) {
    const deletedCount = await this.logRepository.deleteAll({ company });
    return { deletedCount };
  }
}
