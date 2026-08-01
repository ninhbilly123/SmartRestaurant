import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuthRole, getAuthToken, getDefaultRouteForRole } from "../utils/auth";

const RoleRoute = ({ allowedRoles }) => {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token || !role) return <Navigate to="/login" replace />;

  if (allowedRoles.includes(role)) {
    return <Outlet />;
  }

  return <Navigate to={getDefaultRouteForRole(role) || "/login"} replace />;
};

export default RoleRoute;
