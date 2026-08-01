import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isCustomerLoggedIn } from "../../utils/customerAuth";

const ProtectedCustomerRoute = () => {
  const location = useLocation();

  if (!isCustomerLoggedIn()) {
    return (
      <Navigate
        to="/customer/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedCustomerRoute;
