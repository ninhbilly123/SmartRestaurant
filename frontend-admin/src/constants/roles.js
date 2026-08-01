export const ROLE_LABELS = {
  super_admin: "Siêu quản trị",
  admin: "Quản trị viên",
  waiter: "Phục vụ",
  kitchen: "Bếp",
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const ADMIN_DEFAULT_FORM = {
  username: "",
  password: "",
  full_name: "",
  role: "admin",
};

export const EMPLOYEE_DEFAULT_FORM = {
  username: "",
  password: "",
  full_name: "",
  role: "waiter",
};

export const EMPLOYEE_ROLES = ["waiter", "kitchen"];
