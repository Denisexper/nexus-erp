export class SubCategoryRepository {
  async findAll(_criteria) {
    throw new Error('SubCategoryRepository.findAll no implementado');
  }

  async findById(_id, _categoryIds) {
    throw new Error('SubCategoryRepository.findById no implementado');
  }

  async findByNameAndCategory(_name, _categoryId) {
    throw new Error('SubCategoryRepository.findByNameAndCategory no implementado');
  }

  async findIdsByCategories(_categoryIds) {
    throw new Error('SubCategoryRepository.findIdsByCategories no implementado');
  }

  async create(_subCategory) {
    throw new Error('SubCategoryRepository.create no implementado');
  }

  async update(_id, _changes) {
    throw new Error('SubCategoryRepository.update no implementado');
  }
}
