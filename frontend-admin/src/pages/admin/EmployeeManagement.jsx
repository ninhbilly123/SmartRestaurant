import React, { useCallback } from "react";
import { Users } from "lucide-react";
import Alert from "../../components/common/Alert";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import {
  EmployeeStatsGrid,
  UserForm,
  UserManagementHeader,
  UserTable,
} from "../../components/admin/users";
import {
  EMPLOYEE_DEFAULT_FORM,
  EMPLOYEE_ROLES,
} from "../../constants/roles";
import useUserManagement from "../../hooks/useUserManagement";

const EMPLOYEE_FORM_LABELS = {
  createSuccess: "Tạo nhân viên mới thành công!",
  updateSuccess: "Cập nhật nhân viên thành công!",
  error: "Lỗi xử lý",
  toggleConfirmPrefix: "Bạn muốn",
  toggleError: "Lỗi",
};

const EMPLOYEE_ROLE_OPTIONS = [
  { value: "waiter", label: "Phục vụ" },
  { value: "kitchen", label: "Bếp" },
];

const EmployeeManagement = () => {
  const filterEmployees = useCallback(
    (users) => users.filter((user) => EMPLOYEE_ROLES.includes(user.role)),
    [],
  );

  const {
    clearMessage,
    closeToggleDialog,
    confirmToggleStatus,
    formData,
    handleChange,
    handleEditClick,
    handleSubmit,
    isEditing,
    loading,
    message,
    pendingStatusUser,
    requestToggleStatus,
    resetForm,
    showForm,
    toggleForm,
    toggleDialogMessage,
    users,
  } = useUserManagement({
    defaultFormData: EMPLOYEE_DEFAULT_FORM,
    filterUsers: filterEmployees,
    labels: EMPLOYEE_FORM_LABELS,
  });

  if (loading && users.length === 0) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <UserManagementHeader
          actionLabel="Thêm nhân viên"
          description="Quản lý nhân viên phục vụ và bếp"
          icon={Users}
          isFormOpen={showForm}
          onToggleForm={toggleForm}
          theme="teal"
          title="Quản lý nhân viên"
        />

        {message && (
          <Alert
            type={message.type}
            message={message.text}
            onClose={clearMessage}
          />
        )}

        <EmployeeStatsGrid users={users} />

        {showForm && (
          <UserForm
            formData={formData}
            isEditing={isEditing}
            onCancel={resetForm}
            onChange={handleChange}
            onSubmit={handleSubmit}
            passwordPlaceholder={
              isEditing ? "Nhập mật khẩu mới..." : "********"
            }
            roleOptions={EMPLOYEE_ROLE_OPTIONS}
            submitLabel="Lưu lại"
            theme="teal"
            title={
              isEditing
                ? "Cập nhật nhân viên"
                : "Thông tin nhân viên mới"
            }
          />
        )}

        <UserTable
          loading={loading}
          onEdit={handleEditClick}
          onToggleStatus={requestToggleStatus}
          showRoleIcon
          theme="teal"
          users={users}
        />

        <ConfirmDialog
          isOpen={Boolean(pendingStatusUser)}
          onClose={closeToggleDialog}
          onConfirm={() => confirmToggleStatus(pendingStatusUser)}
          title="Xác nhận trạng thái nhân viên"
          message={toggleDialogMessage}
          confirmText="Xác nhận"
          variant={pendingStatusUser?.is_active ? "danger" : "info"}
        />
      </div>
    </div>
  );
};

export default EmployeeManagement;
