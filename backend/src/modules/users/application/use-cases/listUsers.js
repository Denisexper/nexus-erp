export class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ companyId, search, role, isActive, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { items, total } = await this.userRepository.findAll({ companyId, search, role, isActive, skip, limit: limitNum });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
