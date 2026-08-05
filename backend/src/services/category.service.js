import { Op, Transaction } from "sequelize";
import sequelize from "../config/database.js";
import MenuCategory from "../models/menuCategory.js";
import MenuItem from "../models/menuItem.js";

const CATEGORY_STATUSES = ["active", "inactive"];

const normalizeCategoryData = (data) => ({
  ...(data.name !== undefined && { name: data.name.trim() }),
  ...(data.description !== undefined && {
    description: data.description ? data.description.trim() : null,
  }),
  ...(data.display_order !== undefined && { display_order: data.display_order }),
  ...(data.status !== undefined && { status: data.status }),
});

const buildCategoryResponse = async (categoryId) => {
  const [category, itemsCount] = await Promise.all([
    MenuCategory.findByPk(categoryId),
    MenuItem.count({
      where: { category_id: categoryId, is_deleted: false },
    }),
  ]);

  return {
    category,
    metadata: {
      items_count: itemsCount,
    },
  };
};

export class CategoryService {
  static async getAll() {
    return MenuCategory.findAll({
      order: [["created_at", "DESC"]],
    });
  }

  static validateCategoryData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.name !== undefined) {
      const name = data.name?.trim();
      if (!name) {
        errors.push("Category name is required");
      } else if (name.length < 2) {
        errors.push("Category name must be at least 2 characters");
      } else if (name.length > 50) {
        errors.push("Category name cannot exceed 50 characters");
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push("Description cannot exceed 500 characters");
    }

    if (data.display_order !== undefined) {
      if (!Number.isInteger(data.display_order)) {
        errors.push("Display order must be an integer");
      } else if (data.display_order < 0) {
        errors.push("Display order cannot be negative");
      }
    }

    if (data.status !== undefined && !CATEGORY_STATUSES.includes(data.status)) {
      errors.push('Status must be either "active" or "inactive"');
    }

    return errors;
  }

  static async validateUpdateData(categoryId, data) {
    const errors = this.validateCategoryData(data, true);
    if (errors.length > 0) return errors;

    const category = await MenuCategory.findByPk(categoryId);
    if (!category) {
      return ["Category not found"];
    }

    if (data.name !== undefined && data.name.trim() !== category.name) {
      const duplicateCategory = await MenuCategory.findOne({
        where: {
          name: data.name.trim(),
          id: { [Op.ne]: categoryId },
        },
      });

      if (duplicateCategory) {
        errors.push(`Category "${data.name}" already exists`);
      }
    }

    return errors;
  }

  static async update(categoryId, data) {
    const updateData = normalizeCategoryData(data);
    if (Object.keys(updateData).length === 0) {
      throw new Error("No data provided for update");
    }

    const transaction = await sequelize.transaction();
    let committed = false;

    try {
      const category = await MenuCategory.findByPk(categoryId, {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!category) {
        throw new Error("Category not found");
      }

      if (updateData.status === "inactive" && category.status === "active") {
        await MenuItem.update(
          { status: "unavailable" },
          {
            where: {
              category_id: categoryId,
              status: "available",
              is_deleted: false,
            },
            transaction,
          },
        );
      }

      if (updateData.status === "active" && category.status === "inactive") {
        await MenuItem.update(
          { status: "available" },
          {
            where: {
              category_id: categoryId,
              status: "unavailable",
              is_deleted: false,
            },
            transaction,
          },
        );
      }

      await category.update(updateData, { transaction });
      await transaction.commit();
      committed = true;

      const response = await buildCategoryResponse(categoryId);
      response.metadata.updated_fields = Object.keys(updateData);
      return response;
    } catch (error) {
      if (!committed) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  static async validateStatusUpdate(categoryId, newStatus) {
    const errors = [];

    if (!CATEGORY_STATUSES.includes(newStatus)) {
      errors.push('Status must be either "active" or "inactive"');
      return errors;
    }

    const category = await MenuCategory.findByPk(categoryId);
    if (!category) {
      errors.push("Category not found");
      return errors;
    }

    if (category.status === newStatus) {
      errors.push(`Category is already "${newStatus}"`);
    }

    return errors;
  }

  static async updateStatus(categoryId, newStatus) {
    const validationErrors = await this.validateStatusUpdate(categoryId, newStatus);
    if (validationErrors.length > 0) {
      throw new Error(`Status update validation failed: ${validationErrors.join(", ")}`);
    }

    const transaction = await sequelize.transaction();
    let committed = false;

    try {
      const category = await MenuCategory.findByPk(categoryId, {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!category) {
        throw new Error("Category not found");
      }

      const previousStatus = category.status;
      let itemsAffected = 0;

      await category.update({ status: newStatus }, { transaction });

      if (newStatus === "inactive" && previousStatus === "active") {
        const [affectedRows] = await MenuItem.update(
          { status: "unavailable" },
          {
            where: {
              category_id: categoryId,
              status: "available",
              is_deleted: false,
            },
            transaction,
          },
        );
        itemsAffected = affectedRows;
      }

      if (newStatus === "active" && previousStatus === "inactive") {
        const [affectedRows] = await MenuItem.update(
          { status: "available" },
          {
            where: {
              category_id: categoryId,
              status: "unavailable",
              is_deleted: false,
            },
            transaction,
          },
        );
        itemsAffected = affectedRows;
      }

      await transaction.commit();
      committed = true;

      return {
        category: await MenuCategory.findByPk(categoryId),
        metadata: {
          items_affected: itemsAffected,
          previous_status: previousStatus,
        },
      };
    } catch (error) {
      if (!committed) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  static async create(data) {
    const validationErrors = this.validateCategoryData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    const name = data.name.trim();
    const existingCategory = await MenuCategory.findOne({
      where: { name },
    });

    if (existingCategory) {
      throw new Error(`Category "${data.name}" already exists`);
    }

    const displayOrder =
      data.display_order !== undefined
        ? data.display_order
        : ((await MenuCategory.max("display_order")) || 0) + 1;

    const newCategory = await MenuCategory.create({
      name,
      description: data.description ? data.description.trim() : null,
      display_order: displayOrder,
      status: data.status || "active",
    });

    return {
      category: await MenuCategory.findByPk(newCategory.id),
      metadata: {
        display_order: displayOrder,
        created_at: newCategory.created_at,
      },
    };
  }

  static async delete(categoryId) {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
      const category = await MenuCategory.findOne({
        where: { id: categoryId, is_deleted: false },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!category) {
        const error = new Error("Category not found or already deleted");
        error.status = 404;
        throw error;
      }

      const activeItemsCount = await MenuItem.count({
        where: {
          category_id: categoryId,
          is_deleted: false,
        },
        transaction,
      });

      if (activeItemsCount > 0) {
        const error = new Error(
          `Cannot delete category. It contains ${activeItemsCount} active menu items.`,
        );
        error.status = 400;
        throw error;
      }

      await category.update(
        {
          is_deleted: true,
          status: "inactive",
          deleted_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();
      committed = true;

      return category;
    } catch (error) {
      if (!committed) {
        await transaction.rollback();
      }
      throw error;
    }
  }
}
