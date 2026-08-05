import { Op } from "sequelize";
import logger from "../config/logger.js";
import Order from "../models/order.js";
import Table from "../models/table.js";
import QRService from "./qr.service.js";

const TABLE_STATUSES = ["active", "inactive"];
const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "payment_request",
  "payment_pending",
];

const assertNoActiveOrders = async (tableId, action) => {
  const activeOrdersCount = await Order.count({
    where: {
      table_id: tableId,
      status: { [Op.in]: ACTIVE_ORDER_STATUSES },
    },
  });

  if (activeOrdersCount > 0) {
    throw new Error(`Cannot ${action} table while it has active orders`);
  }
};

export class TableService {
  static async create(data) {
    const existingTable = await Table.findOne({
      where: { table_number: data.table_number },
    });

    if (existingTable) {
      throw new Error("Table number already exists");
    }

    return Table.create({
      table_number: data.table_number,
      capacity: data.capacity,
      location: data.location || null,
      description: data.description || null,
      status: data.status || "active",
    });
  }

  static async getTableNameOnly(id) {
    const table = await Table.findByPk(id, {
      attributes: ["table_number"],
    });

    if (!table) throw new Error("Table not found");
    return table;
  }

  static async update(id, data) {
    const table = await Table.findByPk(id);
    if (!table) {
      throw new Error("Table not found");
    }

    if (Object.keys(data).length === 0) {
      throw new Error("No data provided for update");
    }

    if (data.status === "inactive") {
      await assertNoActiveOrders(id, "set inactive");
    }

    if (data.table_number && data.table_number !== table.table_number) {
      const existingTable = await Table.findOne({
        where: {
          table_number: data.table_number,
          id: { [Op.ne]: id },
        },
      });

      if (existingTable) {
        throw new Error("Table number already exists");
      }
    }

    await table.update(data);
    return Table.findByPk(id);
  }

  static async updateStatus(id, status) {
    const table = await Table.findByPk(id);
    if (!table) {
      throw new Error("Table not found");
    }

    if (!TABLE_STATUSES.includes(status)) {
      throw new Error("Invalid status value");
    }

    if (status === "inactive") {
      await assertNoActiveOrders(id, "set inactive");
    }

    await table.update({ status });
    return table;
  }

  static validateTableData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.capacity !== undefined) {
      if (data.capacity === undefined) {
        errors.push("Capacity is required");
      } else if (data.capacity < 1 || data.capacity > 20) {
        errors.push("Capacity must be between 1 and 20");
      }
    }

    if (!isUpdate || data.table_number !== undefined) {
      if (!data.table_number || data.table_number.trim() === "") {
        errors.push("Table number is required");
      } else {
        const tableNumberRegex = /^[A-Za-z0-9-_]+$/;
        if (!tableNumberRegex.test(data.table_number)) {
          errors.push("Table number can only contain letters, numbers, hyphens and underscores");
        }

        if (data.table_number.length > 50) {
          errors.push("Table number cannot exceed 50 characters");
        }
      }
    }

    if (data.location && data.location.length > 100) {
      errors.push("Location cannot exceed 100 characters");
    }

    if (data.status && !TABLE_STATUSES.includes(data.status)) {
      errors.push('Status must be either "active" or "inactive"');
    }

    return errors;
  }

  static async validateUpdateData(tableId, data) {
    const errors = this.validateTableData(data, true);

    if (data.status === "inactive") {
      const activeOrdersCount = await Order.count({
        where: {
          table_id: tableId,
          status: { [Op.in]: ACTIVE_ORDER_STATUSES },
        },
      });

      if (activeOrdersCount > 0) {
        errors.push("Cannot set table inactive while it has active orders");
      }
    }

    return errors;
  }

  static async getAll(filters = {}) {
    const where = {};
    const sortMap = {
      table_number: "table_number",
      capacity: "capacity",
      location: "location",
      status: "status",
      created_at: "created_at",
    };

    const sortBy = sortMap[filters.sortBy] || "created_at";
    const sortOrder = String(filters.sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters.location && filters.location !== "all") {
      where.location = filters.location;
    }

    if (filters.search && filters.search.trim()) {
      const keyword = filters.search.trim();
      where[Op.or] = [
        { table_number: { [Op.iLike]: `%${keyword}%` } },
        { location: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    return Table.findAll({
      where,
      order: [[sortBy, sortOrder]],
    });
  }

  static async delete(id) {
    const table = await Table.findByPk(id);
    if (!table) {
      throw new Error("Table not found");
    }

    await assertNoActiveOrders(id, "delete");
    await table.destroy();

    return { message: "Table deleted successfully" };
  }

  static async generateQR(tableId) {
    const table = await Table.findByPk(tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    const token = QRService.generateToken(table.id);
    await table.update({
      qr_token: token,
      qr_token_created_at: new Date(),
    });

    return table;
  }

  static async regenerateQR(tableId) {
    const table = await Table.findByPk(tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    if (table.qr_token) {
      logger.info(`[SECURITY] QR token regenerated for table ${table.table_number} (${table.id})`);
    }

    return this.generateQR(tableId);
  }

  static async bulkRegenerateQR(tableIds = null) {
    const tables =
      tableIds && tableIds.length > 0
        ? await Table.findAll({ where: { id: { [Op.in]: tableIds } } })
        : await Table.findAll();

    const results = {
      total: tables.length,
      success: 0,
      failed: 0,
      tables: [],
    };

    for (const table of tables) {
      try {
        const token = QRService.generateToken(table.id);
        await table.update({
          qr_token: token,
          qr_token_created_at: new Date(),
        });

        results.success += 1;
        results.tables.push({
          id: table.id,
          table_number: table.table_number,
          status: "success",
        });
      } catch (error) {
        results.failed += 1;
        results.tables.push({
          id: table.id,
          table_number: table.table_number,
          status: "failed",
          error: error.message,
        });
      }
    }

    return results;
  }

  static async getQRUrl(tableId) {
    const table = await Table.findByPk(tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    if (!table.qr_token) {
      throw new Error("Table does not have a QR code. Generate one first.");
    }

    return QRService.generateQRUrl(table.id, table.qr_token);
  }
}
