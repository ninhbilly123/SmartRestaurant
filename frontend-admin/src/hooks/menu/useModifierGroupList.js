import { useCallback, useEffect, useState } from "react";
import { modifierService } from "../../services/menu";

const EMPTY_CONFIRM_DIALOG = {
  isOpen: false,
  type: null,
  id: null,
  name: "",
  groupId: null,
};

const useModifierGroupList = () => {
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM_DIALOG);

  const fetchModifierGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await modifierService.getModifierGroups();
      setModifierGroups(response.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải nhóm tùy chọn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModifierGroups();
  }, [fetchModifierGroups]);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setIsFormOpen(true);
  }, []);

  const handleEditGroup = useCallback((group) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  }, []);

  const handleDeleteGroup = useCallback((group) => {
    setConfirmDialog({
      isOpen: true,
      type: "group",
      id: group.id,
      name: group.name,
      groupId: null,
    });
  }, []);

  const handleDeleteOption = useCallback((groupId, option) => {
    setConfirmDialog({
      isOpen: true,
      type: "option",
      id: option.id,
      name: option.name,
      groupId,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(EMPTY_CONFIRM_DIALOG);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      if (confirmDialog.type === "group") {
        await modifierService.deleteModifierGroup(confirmDialog.id);
        setSuccess("Đã xóa nhóm tùy chọn thành công");
      } else {
        await modifierService.deleteModifierOption(confirmDialog.id);
        setSuccess("Đã xóa lựa chọn thành công");
      }
      fetchModifierGroups();
    } catch (err) {
      setError(err.message || "Không thể xóa");
    } finally {
      closeConfirmDialog();
    }
  }, [closeConfirmDialog, confirmDialog, fetchModifierGroups]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingGroup(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingGroup(null);
    fetchModifierGroups();
    setSuccess(
      editingGroup
        ? "Đã cập nhật nhóm tùy chọn thành công"
        : "Đã tạo nhóm tùy chọn thành công",
    );
  }, [editingGroup, fetchModifierGroups]);

  const toggleExpand = useCallback((groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  return {
    closeConfirmDialog,
    closeForm,
    confirmDelete,
    confirmDialog,
    editingGroup,
    error,
    expandedGroups,
    handleAddGroup,
    handleDeleteGroup,
    handleDeleteOption,
    handleEditGroup,
    handleFormSuccess,
    isFormOpen,
    loading,
    modifierGroups,
    setError,
    setSuccess,
    success,
    toggleExpand,
  };
};

export default useModifierGroupList;
