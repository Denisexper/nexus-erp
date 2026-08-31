// ObjectId válido (24 hex) que nunca existe en la base real. Se usa como
// filtro cuando una consulta scoped por tenant debe devolver "sin
// resultados" en vez de caer a "sin filtro" (que traería datos de otro
// tenant) — por ejemplo cuando alguien pide un `branch`/`warehouse` que no
// pertenece a su company.
export const NO_MATCH_ID = '000000000000000000000000';

// Warehouse/Location/KardexMovement no tienen un campo `company` propio: solo
// llegan a la company por cadena (branch -> company, warehouse -> branch ->
// company, location -> warehouse -> branch -> company). Estos helpers
// resuelven esa cadena una vez por request, para que cada módulo no
// reimplemente el mismo recorrido con los repos que le tocan.

export async function resolveBranchIdsForCompany(companyId, branchRepository) {
  if (!companyId) return undefined;
  return branchRepository.findIdsByCompany(companyId);
}

export async function resolveWarehouseIdsForCompany(companyId, branchRepository, warehouseRepository) {
  if (!companyId) return undefined;
  const branchIds = await branchRepository.findIdsByCompany(companyId);
  return warehouseRepository.findIdsByBranches(branchIds);
}

export async function resolveLocationIdsForCompany(companyId, branchRepository, warehouseRepository, locationRepository) {
  if (!companyId) return undefined;
  const warehouseIds = await resolveWarehouseIdsForCompany(companyId, branchRepository, warehouseRepository);
  return locationRepository.findIdsByWarehouses(warehouseIds);
}

// Category/Supplier sí tienen `company` propio (como Branch). SubCategory y
// SupplierContact no: llegan a la company por cadena (subCategory -> category
// -> company, supplierContact -> supplier -> company), igual que
// warehouse/location con branch.

export async function resolveCategoryIdsForCompany(companyId, categoryRepository) {
  if (!companyId) return undefined;
  return categoryRepository.findIdsByCompany(companyId);
}

export async function resolveSupplierIdsForCompany(companyId, supplierRepository) {
  if (!companyId) return undefined;
  return supplierRepository.findIdsByCompany(companyId);
}
