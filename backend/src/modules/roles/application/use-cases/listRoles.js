export class ListRolesUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute({ company, page = 1, limit = 10 } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { items, total } = await this.roleRepository.findAll({ company, page: pageNum, limit: limitNum });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
