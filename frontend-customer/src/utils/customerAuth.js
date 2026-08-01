const CUSTOMER_TOKEN_KEY = "customer_token";
const CUSTOMER_INFO_KEY = "customer_info";
const AUTH_METHOD_KEY = "auth_method";

export const getCustomerToken = () => localStorage.getItem(CUSTOMER_TOKEN_KEY);

export const getAuthMethod = () => localStorage.getItem(AUTH_METHOD_KEY);

export const setCustomerSession = (token, customer, authMethod) => {
  if (token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  }

  if (customer) {
    localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customer));
  }

  if (authMethod) {
    localStorage.setItem(AUTH_METHOD_KEY, authMethod);
  }
};

export const getCustomerInfo = () => {
  const customerInfo = localStorage.getItem(CUSTOMER_INFO_KEY);
  if (!customerInfo) return null;

  try {
    return JSON.parse(customerInfo);
  } catch (error) {
    console.error("Error parsing customer info:", error);
    clearCustomerAuth();
    return null;
  }
};

export const setCustomerInfo = (customer) => {
  if (!customer) return;
  localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customer));
};

export const clearCustomerAuth = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_INFO_KEY);
  localStorage.removeItem(AUTH_METHOD_KEY);
};

export const isCustomerLoggedIn = () => Boolean(getCustomerToken() && getCustomerInfo());
