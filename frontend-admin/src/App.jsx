import React, { Suspense, lazy } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import {
  getAuthRole,
  getAuthToken,
  getDefaultRouteForRole,
} from "./utils/auth";
import "./App.css";

const Layout = lazy(() => import("./components/layout/Layout"));
const TableList = lazy(() => import("./components/tables/TableList"));
const TableForm = lazy(() => import("./components/tables/TableForm"));
const QRCodePage = lazy(() => import("./components/tables/QRCodePage"));
const Login = lazy(() => import("./pages/Login"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const HomeRedirect = lazy(() => import("./components/common/HomeRedirect"));
const EmployeeManagement = lazy(() => import("./pages/admin/EmployeeManagement"));
const KitchenPage = lazy(() => import("./pages/kitchen/KitchenPage"));
const WaiterPage = lazy(() => import("./pages/waiter/WaiterPage"));
const ReportPage = lazy(() => import("./pages/admin/ReportPage"));
const CategoryList = lazy(() => import("./components/admin/menu/CategoryList"));
const MenuItemList = lazy(() => import("./components/admin/menu/MenuItemList"));
const MenuItemForm = lazy(() => import("./components/admin/menu/MenuItemForm"));
const ModifierGroupList = lazy(() => import("./components/admin/menu/ModifierGroupList"));

const routeFallback = (
  <div className="min-h-screen flex items-center justify-center text-gray-600">
    Đang tải...
  </div>
);

const RoleRoute = ({ allowedRoles }) => {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token || !role) return <Navigate to="/login" replace />;

  if (allowedRoles.includes(role)) {
    return <Outlet />;
  }

  if (role === "kitchen") return <Navigate to="/kitchen" replace />;
  if (role === "waiter") return <Navigate to="/waiter" replace />;

  return <Navigate to={getDefaultRouteForRole(role) || "/login"} replace />;
};

function App() {
  return (
    <Router>
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/login" element={<Login />} />

        {/* 1. KHU VỰC BẾP */}
        <Route element={<RoleRoute allowedRoles={["kitchen"]} />}>
          <Route path="/kitchen" element={<KitchenPage />} />
        </Route>

        {/* 2. KHU VỰC WAITER */}
        <Route element={<RoleRoute allowedRoles={["waiter"]} />}>
          <Route path="/waiter" element={<WaiterPage />} />
        </Route>

        {/* 3. KHU VỰC QUẢN LÝ (ADMIN) */}
        <Route element={<RoleRoute allowedRoles={["admin", "super_admin"]} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />

            {/* Admin Routes */}
            <Route path="/admin/reports" element={<ReportPage />} />
            <Route path="/tables" element={<TableList />} />
            <Route path="/tables/new" element={<TableForm />} />
            <Route path="/tables/:id" element={<TableForm />} />
            <Route path="/tables/:id/qr" element={<QRCodePage />} />

            <Route path="/admin/menu/categories" element={<CategoryList />} />
            <Route path="/admin/menu/items" element={<MenuItemList />} />
            <Route path="/admin/menu/items/new" element={<MenuItemForm />} />
            <Route path="/admin/menu/items/:id" element={<MenuItemForm />} />
            
            <Route
              path="/admin/menu/modifiers"
              element={<ModifierGroupList />}
            />

            <Route path="/admin/employees" element={<EmployeeManagement />} />

            <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<div>404 Not Found</div>} />
          </Route>
        </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
