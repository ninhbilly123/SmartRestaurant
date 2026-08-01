// src/services/tableService.js
import { adminApi, publicApi } from "../config/api";

const tableService = {
  // Get tables with optional server-side filtering and sorting
  getAllTables: async (params = {}) => {
    const response = await adminApi.get("/tables", { params });
    return response.data;
  },

  // Get table by ID
  getTableById: async (id) => {
    const response = await adminApi.get(`/tables/${id}`);
    return response.data;
  },

  // Create new table
  createTable: async (tableData) => {
    const response = await adminApi.post("/tables", tableData);
    return response.data;
  },

  // Update table
  updateTable: async (id, tableData) => {
    const response = await adminApi.put(`/tables/${id}`, tableData);
    return response.data;
  },

  // Update table status
  updateTableStatus: async (id, status) => {
    const response = await adminApi.patch(`/tables/${id}/status`, { status });
    return response.data;
  },

  // Delete table
  deleteTable: async (id) => {
    const response = await adminApi.delete(`/tables/${id}`);
    return response.data;
  },

  // QR Code operations
  generateQRCode: async (id) => {
    const response = await adminApi.post(`/tables/${id}/qr/generate`);
    return response.data;
  },

  regenerateQRCode: async (id) => {
    const response = await adminApi.post(`/tables/${id}/qr/regenerate`);
    return response.data;
  },

  bulkRegenerateQRCodes: async (tableIds = null) => {
    const response = await adminApi.post("/tables/qr/regenerate-all", {
      table_ids: tableIds,
    });
    return response.data;
  },

  getQRPreview: async (id) => {
    const response = await adminApi.get(`/tables/${id}/qr/preview`);
    return response.data;
  },

  downloadQRCode: async (id, format = "png") => {
    const response = await adminApi.get(`/tables/${id}/qr/download`, {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },

  downloadAllQRCodes: async (format = "zip") => {
    const response = await adminApi.get("/tables/qr/download-all", {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },

  // Verify QR code token (public endpoint)
  verifyQRToken: async (tableId, token) => {
    const response = await publicApi.get("/menu", {
      params: { table: tableId, token },
    });
    return response.data;
  },

};

export default tableService;
