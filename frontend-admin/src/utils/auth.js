import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const decodeAuthToken = (token) => {
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    const isExpired = payload.exp && payload.exp * 1000 <= Date.now();

    return isExpired ? null : payload;
  } catch {
    return null;
  }
};

export const getAuthPayload = () => decodeAuthToken(getAuthToken());

export const getAuthRole = () => getAuthPayload()?.role || null;

export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case "super_admin":
      return "/admin/users";
    case "admin":
      return "/tables";
    case "waiter":
      return "/waiter";
    case "kitchen":
      return "/kitchen";
    default:
      return null;
  }
};
