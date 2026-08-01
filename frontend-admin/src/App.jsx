import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import TableList from "./components/tables/TableList";
import TableForm from "./components/tables/TableForm";
import QRCodePage from "./components/tables/QRCodePage";
import Login from "./pages/Login";
import UserManagement from "./pages/admin/UserManagement";
// ĐÃ XÓA IMPORT SuperAdminRoute
import HomeRedirect from "./components/common/HomeRedirect";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import KitchenPage from "./pages/kitchen/KitchenPage";
import WaiterPage from "./pages/waiter/WaiterPage";
import ReportPage from "./pages/admin/ReportPage";

import {
  CategoryList,
  MenuItemList,
  MenuItemForm,
  ModifierGroupList,
} from "./components/admin/menu";
import {
  getAuthRole,
  getAuthToken,
  getDefaultRouteForRole,
} from "./utils/auth";
import "./App.css";

// --- 1. HÀM LẤY ROLE TỪ TOKEN ---
// --- 2. COMPONENT BẢO VỆ CHUNG (RoleRoute) ---
const RoleRoute = ({ allowedRoles }) => {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token || !role) return <Navigate to="/login" replace />;

  // Nếu Role hợp lệ -> Cho vào
  if (allowedRoles.includes(role)) {
    return <Outlet />;
  }

  // Nếu sai quyền -> Đá về chuồng
  if (role === "kitchen") return <Navigate to="/kitchen" replace />;
  if (role === "waiter") return <Navigate to="/waiter" replace />;

  return <Navigate to={getDefaultRouteForRole(role) || "/login"} replace />;
};

function App() {
  return (
    <Router>
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

            {/* --- 4. KHU VỰC SUPER ADMIN (Dùng RoleRoute luôn) --- */}
            {/* Chỉ user có role 'super_admin' mới vào được đây */}
            <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<div>404 Not Found</div>} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
