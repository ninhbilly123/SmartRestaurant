import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CustomerService from "../services/customerService";
import { getAuthMethod, setCustomerInfo } from "../utils/customerAuth";

const DEFAULT_PASSWORD_DATA = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const useCustomerProfile = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState(DEFAULT_PASSWORD_DATA);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [authMethod, setAuthMethod] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getFromPath = useCallback(() => {
    if (location.state?.from) return location.state.from;

    const searchParams = new URLSearchParams(location.search);
    const tableId = searchParams.get("table");
    const token = searchParams.get("token");

    if (tableId) {
      let path = `/menu?table=${tableId}`;
      if (token) path += `&token=${token}`;
      return path;
    }
    return "/menu";
  }, [location.search, location.state]);

  const fromPath = getFromPath();

  useEffect(() => {
    if (customer) {
      setEditData({
        username: customer.username || "",
        phone: customer.phone || "",
      });
    }
  }, [customer]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!CustomerService.isLoggedIn()) {
        navigate("/customer/login", { state: { from: fromPath } });
        return;
      }
      setCustomer(CustomerService.getCurrentCustomer());
    } catch {
      toast.error("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  }, [fromPath, navigate]);

  useEffect(() => {
    fetchProfile();
    setAuthMethod(getAuthMethod());
  }, [fetchProfile]);

  const getInitial = useCallback(() => {
    if (!customer) return "U";
    if (customer.username) return customer.username.charAt(0).toUpperCase();
    if (customer.full_name) return customer.full_name.charAt(0).toUpperCase();
    if (customer.email) return customer.email.charAt(0).toUpperCase();
    return "U";
  }, [customer]);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh không được vượt quá 5MB");
        return;
      }

      try {
        setUploadingAvatar(true);
        const response = await CustomerService.updateAvatar(file);

        if (response.success) {
          const updatedCustomer = {
            ...customer,
            avatar:
              response.data?.avatar ||
              response.avatar ||
              response.data?.customer?.avatar,
          };

          setCustomerInfo(updatedCustomer);
          setCustomer(updatedCustomer);
          toast.success("Cập nhật ảnh đại diện thành công");
        } else {
          toast.error(response.error || "Không thể cập nhật ảnh đại diện");
        }
      } catch (error) {
        toast.error(error.message || "Có lỗi xảy ra khi upload ảnh");
      } finally {
        setUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [customer],
  );

  const handleDeleteAvatar = useCallback(async () => {
    try {
      setDeletingAvatar(true);
      const response = await CustomerService.deleteAvatar();

      if (response.success) {
        const updatedCustomer = { ...customer, avatar: null };
        setCustomerInfo(updatedCustomer);
        setCustomer(updatedCustomer);
        setShowDeleteConfirm(false);
        toast.success("Đã xóa ảnh đại diện");
      } else {
        toast.error(response.error || "Không thể xóa ảnh đại diện");
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi xóa ảnh");
    } finally {
      setDeletingAvatar(false);
    }
  }, [customer]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setPasswordData((prev) => ({ ...prev, [name]: value }));
      if (passwordErrors[name]) {
        setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [passwordErrors],
  );

  const validatePasswordForm = useCallback(() => {
    const errors = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }, [passwordData]);

  const resetPasswordPopup = useCallback(() => {
    setShowChangePassword(false);
    setPasswordData(DEFAULT_PASSWORD_DATA);
    setPasswordErrors({});
  }, []);

  const handleChangePasswordSubmit = useCallback(async () => {
    if (authMethod === "google") {
      toast.error("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu");
      return;
    }

    if (!validatePasswordForm()) return;

    try {
      setChangingPassword(true);
      const response = await CustomerService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      if (response.success) {
        toast.success("Đổi mật khẩu thành công");
        resetPasswordPopup();
      } else {
        toast.error(response.error || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  }, [authMethod, passwordData, resetPasswordPopup, validatePasswordForm]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      if (editData.username && editData.username.length < 3) {
        toast.error("Tên đăng nhập phải có ít nhất 3 ký tự");
        return;
      }

      if (editData.phone && editData.phone.length !== 10) {
        toast.error("Số điện thoại phải có đúng 10 chữ số");
        return;
      }

      if (editData.phone && !/^[0-9]+$/.test(editData.phone)) {
        toast.error("Số điện thoại chỉ được chứa chữ số");
        return;
      }

      const response = await CustomerService.updateProfile(editData);

      if (response.success) {
        const updatedCustomer = { ...customer, ...editData };
        setCustomerInfo(updatedCustomer);
        setCustomer(updatedCustomer);
        setIsEditing(false);
        toast.success("Cập nhật thông tin thành công");
      } else {
        toast.error(response.error || "Cập nhật thất bại");
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  }, [customer, editData]);

  const handleCancel = useCallback(() => {
    setEditData({
      username: customer?.username || "",
      phone: customer?.phone || "",
    });
    setIsEditing(false);
  }, [customer]);

  const handleShowChangePassword = useCallback(() => {
    if (authMethod === "google") {
      toast.info("Tài khoản Google không cần đổi mật khẩu");
      return;
    }
    setShowChangePassword(true);
  }, [authMethod]);

  const handleLogout = useCallback(() => {
    CustomerService.logout();
    navigate("/customer/login", { state: { from: fromPath } });
  }, [fromPath, navigate]);

  return {
    authMethod,
    changingPassword,
    customer,
    deletingAvatar,
    editData,
    fileInputRef,
    fromPath,
    getInitial,
    handleAvatarChange,
    handleAvatarClick,
    handleCancel,
    handleChangePasswordSubmit,
    handleDeleteAvatar,
    handleInputChange,
    handleLogout,
    handlePasswordChange,
    handlePasswordPopupClose: resetPasswordPopup,
    handleSave,
    handleShowChangePassword,
    isEditing,
    loading,
    navigate,
    passwordData,
    passwordErrors,
    saving,
    setIsEditing,
    setShowDeleteConfirm,
    showChangePassword,
    showDeleteConfirm,
    uploadingAvatar,
  };
};

export default useCustomerProfile;
