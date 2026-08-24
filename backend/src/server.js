import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "node:path";

import { port } from "#shared/lib/env.js";
import { mongoConnect } from "#shared/lib/db.js";
import { globalRateLimiter } from "#shared/middleware/globalRateLimit.middleware.js";

// rutas con metadata (para auto-discovery de permisos)
import authRoutes from "#modules/auth/infrastructure/http/auth.routes.js";
import userRoutes, { userRoutes as userRoutesMetadata } from "#modules/users/infrastructure/http/user.routes.js";
import rolesRoutes, { roleRoutes as roleRoutesMetadata } from "#modules/roles/infrastructure/http/role.routes.js";
import logsRoutes, { logRoutes as logRoutesMetadata } from "#modules/logs/infrastructure/http/log.routes.js";
import companiesRoutes, { companyRoutes as companyRoutesMetadata } from "#modules/companies/infrastructure/http/company.routes.js";
import geoRoutes, { geoRoutes as geoRoutesMetadata } from "#modules/geo/infrastructure/http/geo.routes.js";
import branchesRoutes, { branchRoutes as branchRoutesMetadata } from "#modules/branches/infrastructure/http/branch.routes.js";
import warehouseCategoriesRoutes, { warehouseCategoryRoutes as warehouseCategoryRoutesMetadata } from "#modules/warehouse-categories/infrastructure/http/warehouseCategory.routes.js";
import warehousesRoutes, { warehouseRoutes as warehouseRoutesMetadata } from "#modules/warehouses/infrastructure/http/warehouse.routes.js";
import locationsRoutes, { locationRoutes as locationRoutesMetadata } from "#modules/locations/infrastructure/http/location.routes.js";
import countriesRoutes, { countryRoutes as countryRoutesMetadata } from "#modules/countries/infrastructure/http/country.routes.js";
import categoriesRoutes, { categoryRoutes as categoryRoutesMetadata } from "#modules/categories/infrastructure/http/category.routes.js";
import unitsRoutes, { unitRoutes as unitRoutesMetadata } from "#modules/units/infrastructure/http/unit.routes.js";
import subCategoriesRoutes, { subCategoryRoutes as subCategoryRoutesMetadata } from "#modules/sub-categories/infrastructure/http/subCategory.routes.js";
import suppliersRoutes, { supplierRoutes as supplierRoutesMetadata } from "#modules/suppliers/infrastructure/http/supplier.routes.js";
import supplierContactsRoutes, { supplierContactRoutes as supplierContactRoutesMetadata } from "#modules/supplier-contacts/infrastructure/http/supplierContact.routes.js";
import productsRoutes, { productRoutes as productRoutesMetadata } from "#modules/products/infrastructure/http/product.routes.js";
import productImagesRoutes, { productImageRoutes as productImageRoutesMetadata } from "#modules/product-images/infrastructure/http/productImage.routes.js";
import kardexRoutes, { kardexRoutes as kardexRoutesMetadata } from "#modules/kardex/infrastructure/http/kardex.routes.js";

// bootstrap: sincronizar el catálogo de permisos y los roles del sistema
import { MongoPermissionRepository } from "#modules/permissions/infrastructure/persistence/MongoPermissionRepository.js";
import { SyncDiscoveredPermissionsUseCase } from "#modules/permissions/application/use-cases/syncDiscoveredPermissions.js";
import { seedRoles } from "#modules/roles/infrastructure/seed/seedRoles.js";
import { seedGeo } from "#modules/geo/infrastructure/persistence/seed/seedGeo.js";

// Configurar servidor
const server = express();

// Configuración server con json
server.use(express.json());

// Configuración de cors
server.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Configuramos morgan (ver las peticiones http en la terminal)
server.use(morgan("dev"));

// Archivos subidos (ej. imágenes de producto), servidos como estáticos
server.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rate limit global: 100 req / 15 min por IP sobre toda la API
server.use("/api", globalRateLimiter);

// Levantar servidor
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Configuración base de datos
mongoConnect().then(async () => {
  console.log("MongoDB conectado");

  await seedGeo();

  const routeModules = [userRoutesMetadata, roleRoutesMetadata, logRoutesMetadata, companyRoutesMetadata, geoRoutesMetadata, branchRoutesMetadata, warehouseCategoryRoutesMetadata, warehouseRoutesMetadata, locationRoutesMetadata, countryRoutesMetadata, categoryRoutesMetadata, unitRoutesMetadata, subCategoryRoutesMetadata, supplierRoutesMetadata, supplierContactRoutesMetadata, productRoutesMetadata, productImageRoutesMetadata, kardexRoutesMetadata];

  // Auto-descubrir y sincronizar permisos desde la metadata de las rutas
  const syncDiscoveredPermissions = new SyncDiscoveredPermissionsUseCase(new MongoPermissionRepository());
  const discoveredPermissionCodes = await syncDiscoveredPermissions.execute(routeModules);

  // Sincronizar roles del sistema (admin siempre recibe todos los permisos descubiertos)
  await seedRoles(discoveredPermissionCodes);
});

// Inicializar rutas
// Rutas de autenticación (públicas)
server.use("/api", authRoutes);

// Rutas de recursos (protegidas)
server.use("/api", userRoutes);
server.use("/api/roles", rolesRoutes);
server.use("/api", logsRoutes);
server.use("/api/companies", companiesRoutes);
server.use("/api/geo", geoRoutes);
server.use("/api/branches", branchesRoutes);
server.use("/api/warehouse-categories", warehouseCategoriesRoutes);
server.use("/api/warehouses", warehousesRoutes);
server.use("/api/locations", locationsRoutes);
server.use("/api/countries", countriesRoutes);
server.use("/api/categories", categoriesRoutes);
server.use("/api/units", unitsRoutes);
server.use("/api/sub-categories", subCategoriesRoutes);
server.use("/api/suppliers", suppliersRoutes);
server.use("/api/supplier-contacts", supplierContactsRoutes);
server.use("/api/products", productsRoutes);
server.use("/api/product-images", productImagesRoutes);
server.use("/api/kardex", kardexRoutes);
