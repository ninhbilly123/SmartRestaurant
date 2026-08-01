import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthRole, getDefaultRouteForRole } from "../../utils/auth";

const HomeRedirect = () => {
  const role = getAuthRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(role) || "/login"} replace />;
};

export default HomeRedirect;
