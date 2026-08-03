import React, { useCallback } from "react";
import Alert from "../../components/common/Alert";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  UserForm,
  UserManagementHeader,
  UserTable,
} from "../../components/admin/users";
import { ADMIN_DEFAULT_FORM } from "../../constants/roles";
import useUserManagement from "../../hooks/useUserManagement";

const ADMIN_FORM_LABELS = {
  createSuccess: "Tạo tài khoản Admin thành công!",
  updateSuccess: "Cập nhật thông tin thành công!",
  error: "Đã có lỗi xảy ra",
  toggleConfirmPrefix: "Bạn có chắc muốn",
  toggleError: "Lỗi cập nhật trạng thái",
};

const UserManagement = () => {
  const filterAdminUsers = useCallback(
    (users) =>
      users.filter((user) => ["admin", "super_admin"].includes(user.role)),
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
    defaultFormData: ADMIN_DEFAULT_FORM,
    filterUsers: filterAdminUsers,
    labels: ADMIN_FORM_LABELS,
  });

  return (
    <div className="p-6 font-sans">
      <UserManagementHeader
        actionLabel="Tạo admin mới"
        description="Quản lý, chỉnh sửa và phân quyền quản trị viên"
        isFormOpen={showForm}
        onToggleForm={toggleForm}
        title="Quản lý admin"
      />

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={clearMessage}
        />
      )}

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
          submitLabel={isEditing ? "Lưu thay đổi" : "Xác nhận tạo"}
          title={
            isEditing
              ? "Cập nhật thông tin admin"
              : "Cấp tài khoản admin mới"
          }
        />
      )}

      <UserTable
        loading={loading}
        onEdit={handleEditClick}
        onToggleStatus={requestToggleStatus}
        showId
        users={users}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingStatusUser)}
        onClose={closeToggleDialog}
        onConfirm={() => confirmToggleStatus(pendingStatusUser)}
        title="Xác nhận trạng thái tài khoản"
        message={toggleDialogMessage}
        confirmText="Xác nhận"
        variant={pendingStatusUser?.is_active ? "danger" : "info"}
      />
    </div>
  );
};

export default UserManagement;
