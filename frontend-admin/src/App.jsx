import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import RoleRoute from "./routes/RoleRoute";
import "./App.css";

const Login = lazy(() => import("./pages/Login"));
const KitchenPage = lazy(() => import("./pages/kitchen/KitchenPage"));
const WaiterPage = lazy(() => import("./pages/waiter/WaiterPage"));

const routeFallback = (
  <div className="min-h-screen flex items-center justify-center text-gray-600">
    Đang tải...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RoleRoute allowedRoles={["kitchen"]} />}>
            <Route path="/kitchen" element={<KitchenPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["waiter"]} />}>
            <Route path="/waiter" element={<WaiterPage />} />
          </Route>
          <AdminRoutes />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
