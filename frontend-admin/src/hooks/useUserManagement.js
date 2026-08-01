import { useCallback, useEffect, useState } from "react";
import {
  createNewUser,
  getAllUsers,
  toggleUserStatus,
  updateUser,
} from "../services/authService";

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
      try {
        if (isEditing) {
          await updateUser(editingId, formData);
          alert(labels.updateSuccess);
        } else {
          await createNewUser(formData);
          alert(labels.createSuccess);
        }

        resetForm();
        fetchUsers();
      } catch (err) {
        alert(err.message || labels.error);
      }
    },
    [editingId, fetchUsers, formData, isEditing, labels, resetForm],
  );

  const handleToggleStatus = useCallback(
    async (user) => {
      const action = user.is_active ? "KHÓA" : "MỞ KHÓA";
      const displayName = user.full_name || user.username;

      if (!window.confirm(`${labels.toggleConfirmPrefix} ${action} ${displayName}?`)) {
        return;
      }

      try {
        await toggleUserStatus(user.id, !user.is_active);
        fetchUsers();
      } catch (err) {
        alert(`${labels.toggleError}: ${err.message}`);
      }
    },
    [fetchUsers, labels],
  );

  return {
    formData,
    handleChange,
    handleEditClick,
    handleSubmit,
    handleToggleStatus,
    isEditing,
    loading,
    resetForm,
    setFormData,
    showForm,
    toggleForm,
    users,
  };
};

export default useUserManagement;
