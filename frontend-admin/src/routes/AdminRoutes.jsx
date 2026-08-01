import React, { lazy } from "react";
import { Route } from "react-router-dom";
import RoleRoute from "./RoleRoute";

const Layout = lazy(() => import("../components/layout/Layout"));
const TableList = lazy(() => import("../components/tables/TableList"));
const TableForm = lazy(() => import("../components/tables/TableForm"));
const QRCodePage = lazy(() => import("../components/tables/QRCodePage"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const HomeRedirect = lazy(() => import("../components/common/HomeRedirect"));
const EmployeeManagement = lazy(() => import("../pages/admin/EmployeeManagement"));
const ReportPage = lazy(() => import("../pages/admin/ReportPage"));
const CategoryList = lazy(() => import("../components/admin/menu/CategoryList"));
const MenuItemList = lazy(() => import("../components/admin/menu/MenuItemList"));
const MenuItemForm = lazy(() => import("../components/admin/menu/MenuItemForm"));
const ModifierGroupList = lazy(() =>
  import("../components/admin/menu/ModifierGroupList"),
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const AdminRoutes = () => {
  return (
    <Route element={<RoleRoute allowedRoles={["admin", "super_admin"]} />}>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/admin/reports" element={<ReportPage />} />
        <Route path="/tables" element={<TableList />} />
        <Route path="/tables/new" element={<TableForm />} />
        <Route path="/tables/:id" element={<TableForm />} />
        <Route path="/tables/:id/qr" element={<QRCodePage />} />
        <Route path="/admin/menu/categories" element={<CategoryList />} />
        <Route path="/admin/menu/items" element={<MenuItemList />} />
        <Route path="/admin/menu/items/new" element={<MenuItemForm />} />
        <Route path="/admin/menu/items/:id" element={<MenuItemForm />} />
        <Route path="/admin/menu/modifiers" element={<ModifierGroupList />} />
        <Route path="/admin/employees" element={<EmployeeManagement />} />

        <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  );
};

export default AdminRoutes;
