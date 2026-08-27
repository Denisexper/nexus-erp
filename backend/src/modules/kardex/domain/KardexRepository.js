export class KardexRepository {
  async findAll(_criteria) {
    throw new Error('KardexRepository.findAll no implementado');
  }

  async findById(_id, _locationIds) {
    throw new Error('KardexRepository.findById no implementado');
  }

  async create(_movement) {
    throw new Error('KardexRepository.create no implementado');
  }

  async createMany(_movements) {
    throw new Error('KardexRepository.createMany no implementado');
  }

  // Existencia actual de un producto en una ubicación puntual: suma de
  // movimientos 'in' menos suma de movimientos 'out'.
  async getStockByProductAndLocation(_productId, _locationId) {
    throw new Error('KardexRepository.getStockByProductAndLocation no implementado');
  }

  // Existencia de cada producto dentro de una ubicación.
  async getStockByLocation(_locationId) {
    throw new Error('KardexRepository.getStockByLocation no implementado');
  }

  // Existencia de un producto en cada ubicación donde tiene stock.
  // `locationIds`, cuando se pasa, restringe el resultado a las ubicaciones
  // de una company (Product todavía es global, así que sin esto se verían
  // existencias de otros tenants para el mismo producto compartido).
  async getStockByProduct(_productId, _locationIds) {
    throw new Error('KardexRepository.getStockByProduct no implementado');
  }

  // Suma total de existencias (todos los productos) en una ubicación.
  // La usa RN-WHS-007 para impedir desactivar una ubicación con existencias.
  async getTotalStockByLocation(_locationId) {
    throw new Error('KardexRepository.getTotalStockByLocation no implementado');
  }
}
