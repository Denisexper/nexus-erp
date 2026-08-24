export class ListMovementsUseCase {
  constructor(kardexRepository) {
    this.kardexRepository = kardexRepository;
  }

  async execute(criteria) {
    return this.kardexRepository.findAll(criteria);
  }
}
