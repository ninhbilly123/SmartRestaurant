import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryService } from "../../services/menu";

const EMPTY_CONFIRM_DIALOG = {
  isOpen: false,
  categoryId: null,
  categoryName: "",
  action: null,
};

const useCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sortBy, setSortBy] = useState("display_order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM_DIALOG);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "name") {
        aVal = aVal?.toLowerCase() || "";
        bVal = bVal?.toLowerCase() || "";
      }

      if (sortBy === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [categories, sortBy, sortOrder]);

  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setIsFormOpen(true);
  }, []);

  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  }, []);

  const handleDeleteCategory = useCallback((category) => {
    setConfirmDialog({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      action: "delete",
    });
  }, []);

  const handleStatusChange = useCallback((category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    setConfirmDialog({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      action: "status",
      newStatus,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(EMPTY_CONFIRM_DIALOG);
  }, []);

  const confirmAction = useCallback(async () => {
    try {
      const { categoryId, action, newStatus } = confirmDialog;

      if (action === "delete") {
        await categoryService.deleteCategory(categoryId);
        setSuccess("Xóa danh mục thành công");
      } else if (action === "status") {
        await categoryService.updateCategoryStatus(categoryId, newStatus);
        setSuccess(
          `Đã cập nhật trạng thái danh mục thành ${
            newStatus === "active" ? "Hoạt động" : "Tạm ngừng"
          }`,
        );
      }

      fetchCategories();
    } catch (err) {
      setError(err.message || "Không thể thực hiện thao tác");
    } finally {
      closeConfirmDialog();
    }
  }, [closeConfirmDialog, confirmDialog, fetchCategories]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingCategory(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingCategory(null);
    fetchCategories();
    setSuccess(
      editingCategory
        ? "Cập nhật danh mục thành công"
        : "Tạo danh mục thành công",
    );
  }, [editingCategory, fetchCategories]);

  return {
    categories,
    closeConfirmDialog,
    closeForm,
    confirmAction,
    confirmDialog,
    editingCategory,
    error,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleFormSuccess,
    handleSort,
    handleStatusChange,
    isFormOpen,
    loading,
    setError,
    setSuccess,
    sortBy,
    sortOrder,
    sortedCategories,
    success,
  };
};

export default useCategoryList;
