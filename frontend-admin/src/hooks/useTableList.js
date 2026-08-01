import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tableService from "../services/tableService";
import { downloadBlob } from "../utils/downloadFile";

const EMPTY_CONFIRM_DIALOG = {
  isOpen: false,
  tableId: null,
  tableName: "",
  action: null,
};

const useTableList = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [summaryTables, setSummaryTables] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    location: "all",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM_DIALOG);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tableService.getAllTables({
        status: filters.status,
        location: filters.location,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      setTables(response.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.location, filters.status, sortBy, sortOrder]);

  const fetchLocationOptions = useCallback(async () => {
    try {
      const response = await tableService.getAllTables({
        sortBy: "location",
        sortOrder: "asc",
      });
      const allTables = response.data || [];
      const locations = [
        ...new Set(allTables.map((table) => table.location).filter(Boolean)),
      ];
      setSummaryTables(allTables);
      setLocationOptions(
        locations.map((location) => ({ value: location, label: location })),
      );
    } catch {
      setLocationOptions([]);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    fetchLocationOptions();
  }, [fetchLocationOptions]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      location: "all",
      search: "",
    });
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

  const handleStatusChange = useCallback((tableId, tableName, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setConfirmDialog({
      isOpen: true,
      tableId,
      tableName,
      action: "status",
      newStatus,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(EMPTY_CONFIRM_DIALOG);
  }, []);

  const confirmStatusChange = useCallback(async () => {
    try {
      const { tableId, newStatus } = confirmDialog;
      await tableService.updateTableStatus(tableId, newStatus);
      setSuccess(
        `Đã cập nhật trạng thái bàn thành ${
          newStatus === "active" ? "hoạt động" : "ngừng hoạt động"
        }`,
      );
      fetchTables();
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái bàn");
    } finally {
      closeConfirmDialog();
    }
  }, [closeConfirmDialog, confirmDialog, fetchTables]);

  const handleDownloadAllQR = useCallback(async (format = "zip") => {
    try {
      setError(null);
      const blob = await tableService.downloadAllQRCodes(format);
      downloadBlob(blob, `all_tables_qr.${format}`);
      setSuccess(`Đã tải tất cả mã QR dạng ${format.toUpperCase()}`);
    } catch (err) {
      setError(err.message || "Không thể tải mã QR");
    }
  }, []);

  return {
    closeConfirmDialog,
    confirmDialog,
    confirmStatusChange,
    error,
    filters,
    handleDownloadAllQR,
    handleFilterChange,
    handleSort,
    handleStatusChange,
    loading,
    locationOptions,
    navigate,
    resetFilters,
    setError,
    setSuccess,
    sortBy,
    sortOrder,
    success,
    summaryTables,
    tables,
  };
};

export default useTableList;
