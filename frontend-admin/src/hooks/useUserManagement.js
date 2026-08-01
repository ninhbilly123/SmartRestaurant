import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  getAllUsers,
  toggleUserStatus,
  updateUser,
} from "../services/userService";

const useUserManagement = ({
  defaultFormData,
  filterUsers = (users) => users,
  labels,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [message, setMessage] = useState(null);
  const [pendingStatusUser, setPendingStatusUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(filterUsers(data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterUsers]);

  const clearMessage = useCallback(() => setMessage(null), []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  }, [defaultFormData]);

  const toggleForm = useCallback(() => {
    if (showForm) {
      resetForm();
      return;
    }

    setFormData(defaultFormData);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  }, [defaultFormData, resetForm, showForm]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEditClick = useCallback((user) => {
    setFormData({
      username: user.username,
      password: "",
      full_name: user.full_name,
      role: user.role,
    });
    setEditingId(user.id);
    setIsEditing(true);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setMessage(null);
      try {
        if (isEditing) {
          await updateUser(editingId, formData);
          setMessage({ type: "success", text: labels.updateSuccess });
        } else {
          await createUser(formData);
          setMessage({ type: "success", text: labels.createSuccess });
        }

        resetForm();
        fetchUsers();
      } catch (err) {
        setMessage({ type: "error", text: err.message || labels.error });
      }
    },
    [editingId, fetchUsers, formData, isEditing, labels, resetForm],
  );

  const requestToggleStatus = useCallback((user) => {
    setPendingStatusUser(user);
  }, []);

  const closeToggleDialog = useCallback(() => {
    setPendingStatusUser(null);
  }, []);

  const confirmToggleStatus = useCallback(
    async (user) => {
      if (!user) return;
      setMessage(null);
      try {
        await toggleUserStatus(user.id, !user.is_active);
        fetchUsers();
      } catch (err) {
        setMessage({ type: "error", text: `${labels.toggleError}: ${err.message}` });
      } finally {
        closeToggleDialog();
      }
    },
    [closeToggleDialog, fetchUsers, labels],
  );

  const pendingAction = pendingStatusUser?.is_active ? "KHÓA" : "MỞ KHÓA";
  const pendingDisplayName =
    pendingStatusUser?.full_name || pendingStatusUser?.username || "";

  return {
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
    setFormData,
    showForm,
    toggleForm,
    toggleDialogMessage: pendingStatusUser
      ? `${labels.toggleConfirmPrefix} ${pendingAction} ${pendingDisplayName}?`
      : "",
    users,
  };
};

export default useUserManagement;
