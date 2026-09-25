export class GetEntityHistoryUseCase {
  constructor(logRepository) {
    this.logRepository = logRepository;
  }

  async execute({ company, entityId, entityModel }) {
    return this.logRepository.findByEntity({ company, entityId, entityModel });
  }
}
