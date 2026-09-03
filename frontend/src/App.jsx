import { Route, Router as SolidRouter, Navigate } from "@solidjs/router";
import { lazy } from "solid-js";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "solid-sonner";

const CompanySearch = lazy(() => import("./pages/CompanySearch"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Logs = lazy(() => import("./pages/Logs"));
const Roles = lazy(() => import("./pages/Roles"));
const Companies = lazy(() => import("./features/companies/Companies"));
const Branches = lazy(() => import("./features/branches/Branches"));
const WarehouseCategories = lazy(() =>
  import("./features/warehouse-categories/WarehouseCategories"),
);
const Warehouses = lazy(() => import("./features/warehouses/Warehouses"));
const Locations = lazy(() => import("./features/locations/Locations"));
const Countries = lazy(() => import("./features/countries/Countries"));
const Categories = lazy(() => import("./features/categories/Categories"));
const SubCategories = lazy(() =>
  import("./features/sub-categories/SubCategories"),
);
const Units = lazy(() => import("./features/units/Units"));
const Suppliers = lazy(() => import("./features/suppliers/Suppliers"));
const SupplierContacts = lazy(() =>
  import("./features/supplier-contacts/SupplierContacts"),
);
const Products = lazy(() => import("./features/products/Products"));
const Kardex = lazy(() => import("./features/kardex/Kardex"));
const ExpenseTypes = lazy(() =>
  import("./features/expense-types/ExpenseTypes"),
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton expand={false} />
        <SolidRouter>
          <Route path="/login" component={() => <Navigate href="/" />} />
          <Route path="/login/:slug" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/users" component={Users} />
          <Route path="/logs" component={Logs} />
          <Route path="/roles" component={Roles} />
          <Route path="/companies" component={Companies} />
          <Route path="/branches" component={Branches} />
          <Route
            path="/warehouse-categories"
            component={WarehouseCategories}
          />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/locations" component={Locations} />
          <Route path="/kardex" component={Kardex} />
          <Route path="/countries" component={Countries} />
          <Route path="/categories" component={Categories} />
          <Route path="/sub-categories" component={SubCategories} />
          <Route path="/units" component={Units} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/supplier-contacts" component={SupplierContacts} />
          <Route path="/products" component={Products} />
          <Route path="/expense-types" component={ExpenseTypes} />
          <Route path="/" component={CompanySearch} />
        </SolidRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
