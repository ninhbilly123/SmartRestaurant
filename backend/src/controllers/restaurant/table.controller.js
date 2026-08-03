import logger from "../../config/logger.js";
import Table from "../../models/table.js";
import { TableService } from "../../services/table.service.js";

export const getAllTable = async (req, res) => {
  try {
    const tables = await TableService.getAll(req.query);

    return res.json({
      success: true,
      message: "Get all tables from database",
      data: tables,
    });
  } catch (error) {
    logger.error("Error getting tables:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    return res.json({
      success: true,
      message: `Get table by ID: ${id}`,
      data: table,
    });
  } catch (error) {
    logger.error("Error getting table by ID:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getTableNameByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID bàn không hợp lệ",
      });
    }

    const table = await TableService.getTableNameOnly(id);
    return res.json({ success: true, data: table });
  } catch (error) {
    logger.error("Error getting table name:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createTable = async (req, res) => {
  try {
    const validationErrors = TableService.validateTableData(req.validatedData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const newTable = await TableService.create(req.validatedData);

    return res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: newTable,
    });
  } catch (error) {
    logger.error("Error creating table:", error);

    if (error.message === "Table number already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const validationErrors = await TableService.validateUpdateData(
      id,
      req.validatedData,
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const updatedTable = await TableService.update(id, req.validatedData);

    return res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: updatedTable,
    });
  } catch (error) {
    logger.error("Error updating table:", error);

    if (error.message === "Table not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message === "Table number already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message === "No data provided for update") {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const updatedTable = await TableService.updateStatus(
      req.params.id,
      req.validatedData.status,
    );

    return res.status(200).json({
      success: true,
      message: "Table status updated successfully",
      data: updatedTable,
    });
  } catch (error) {
    logger.error("Error updating table status:", error);

    if (error.message === "Table not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const result = await TableService.delete(req.params.id);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === "Table not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    logger.error("Error deleting table:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
