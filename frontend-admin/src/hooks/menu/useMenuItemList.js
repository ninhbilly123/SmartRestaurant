import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryService, menuItemService } from "../../services/menu";

const ITEMS_PER_PAGE = 4;

const useMenuItemList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    category_id: "all",
    status: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    itemId: null,
    itemName: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsRes, categoriesRes] = await Promise.all([
        menuItemService.getAllItems(),
        categoryService.getCategories(),
      ]);
      setItems(itemsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách món ăn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedItems = useMemo(() => {
    const filteredItems = items.filter((item) => {
      if (item.is_deleted) return false;
      if (
        filters.category_id !== "all" &&
        item.category_id !== filters.category_id
      ) {
        return false;
      }
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      if (
        filters.search &&
        !item.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    return [...filteredItems].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "name") {
        aVal = aVal?.toLowerCase() || "";
        bVal = bVal?.toLowerCase() || "";
      }
      if (sortBy === "price" || sortBy === "popularity") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      if (sortBy === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [filters, items, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

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

  const handleDeleteItem = useCallback((item) => {
    setConfirmDialog({
      isOpen: true,
      itemId: item.id,
      itemName: item.name,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ isOpen: false, itemId: null, itemName: "" });
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await menuItemService.deleteItem(confirmDialog.itemId);
      setSuccess("Đã xóa món ăn thành công");
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể xóa món ăn");
    } finally {
      closeConfirmDialog();
    }
  }, [closeConfirmDialog, confirmDialog.itemId, fetchData]);

  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categories.find((item) => item.id === categoryId);
      return category ? category.name : "-";
    },
    [categories],
  );

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  return {
    categories,
    closeConfirmDialog,
    confirmDelete,
    confirmDialog,
    currentPage,
    error,
    filters,
    formatPrice,
    getCategoryName,
    handleDeleteItem,
    handleFilterChange,
    handleSort,
    items,
    itemsPerPage: ITEMS_PER_PAGE,
    loading,
    navigate,
    paginatedItems,
    setCurrentPage,
    setError,
    setSuccess,
    sortBy,
    sortOrder,
    sortedItems,
    success,
    totalPages,
  };
};

export default useMenuItemList;
