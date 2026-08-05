import { Op, col, fn } from "sequelize";
import MenuCategory from "../models/menuCategory.js";
import MenuItem from "../models/menuItem.js";
import MenuItemPhoto from "../models/menuItemPhoto.js";
import ModifierGroup from "../models/modifierGroup.js";
import ModifierOption from "../models/modifierOption.js";
import OrderItem from "../models/orderItem.js";

const ITEM_STATUSES = ["available", "unavailable", "sold_out"];

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const itemListInclude = [
  {
    model: MenuItemPhoto,
    as: "photos",
    attributes: ["id", "url", "is_primary"],
  },
  {
    model: MenuCategory,
    as: "category",
    attributes: ["id", "name"],
  },
];

const itemDetailInclude = [
  ...itemListInclude,
  {
    model: ModifierGroup,
    as: "modifierGroups",
    include: [
      {
        model: ModifierOption,
        as: "options",
        attributes: ["id", "name", "price_adjustment", "status"],
      },
    ],
  },
];

const normalizeItemData = (data) => ({
  ...(data.category_id !== undefined && { category_id: data.category_id }),
  ...(data.name !== undefined && { name: data.name.trim() }),
  ...(data.description !== undefined && {
    description: data.description ? data.description.trim() : null,
  }),
  ...(data.price !== undefined && { price: data.price }),
  ...(data.prep_time_minutes !== undefined && {
    prep_time_minutes: data.prep_time_minutes,
  }),
  ...(data.status !== undefined && { status: data.status }),
  ...(data.is_chef_recommended !== undefined && {
    is_chef_recommended: data.is_chef_recommended,
  }),
});

export class ItemService {
  static async getAll() {
    const menuItems = await MenuItem.findAll({
      include: itemListInclude,
      order: [["created_at", "DESC"]],
    });

    const itemIds = menuItems.map((item) => item.id);
    const popularityMap = {};

    if (itemIds.length > 0) {
      const popularityCounts = await OrderItem.findAll({
        attributes: [
          "menu_item_id",
          [fn("SUM", col("quantity")), "order_count"],
        ],
        where: {
          menu_item_id: { [Op.in]: itemIds },
          status: { [Op.notIn]: ["cancelled"] },
        },
        group: ["menu_item_id"],
        raw: true,
      });

      popularityCounts.forEach((row) => {
        popularityMap[row.menu_item_id] = parseInt(row.order_count, 10) || 0;
      });
    }

    return menuItems.map((item) => ({
      ...item.toJSON(),
      popularity: popularityMap[item.id] || 0,
    }));
  }

  static async getById(id) {
    const item = await MenuItem.findByPk(id, {
      include: itemDetailInclude,
    });

    if (!item) {
      throw createError("Item not found", 404);
    }

    return item;
  }

  static async create(data, transaction = null) {
    const itemData = normalizeItemData(data);
    const existingItem = await MenuItem.findOne({
      where: {
        category_id: itemData.category_id,
        name: itemData.name,
        is_deleted: false,
      },
      transaction,
    });

    if (existingItem) {
      throw createError("Item name already exists in this category");
    }

    return MenuItem.create(
      {
        category_id: itemData.category_id,
        name: itemData.name,
        description: itemData.description || null,
        price: itemData.price,
        prep_time_minutes: itemData.prep_time_minutes || 0,
        status: itemData.status || "available",
        is_chef_recommended: itemData.is_chef_recommended || false,
      },
      { transaction },
    );
  }

  static async update(id, data) {
    const updateData = normalizeItemData(data);
    const item = await MenuItem.findOne({ where: { id, is_deleted: false } });

    if (!item) {
      throw createError("Item not found", 404);
    }

    if (Object.keys(updateData).length === 0) {
      throw createError("No data provided for update");
    }

    if (
      (updateData.name && updateData.name !== item.name) ||
      (updateData.category_id && updateData.category_id !== item.category_id)
    ) {
      const targetCategoryId = updateData.category_id || item.category_id;
      const targetName = updateData.name || item.name;

      const existingItem = await MenuItem.findOne({
        where: {
          category_id: targetCategoryId,
          name: targetName,
          id: { [Op.ne]: id },
          is_deleted: false,
        },
      });

      if (existingItem) {
        throw createError("Item name already exists in this category");
      }
    }

    await item.update(updateData);
    return this.getById(id);
  }

  static async delete(id) {
    const item = await MenuItem.findOne({
      where: {
        id,
        is_deleted: false,
      },
      include: [
        {
          model: MenuCategory,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!item) {
      throw createError("Menu item not found or already deleted", 404);
    }

    await item.update({
      is_deleted: true,
      status: "unavailable",
      deleted_at: new Date(),
    });

    const activeItemsCount = await MenuItem.count({
      where: {
        category_id: item.category_id,
        is_deleted: false,
      },
    });

    return {
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      category_name: item.category?.name,
      remaining_items_in_category: activeItemsCount,
      deleted_at: item.deleted_at,
    };
  }

  static validateItemData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.name !== undefined) {
      if (data.name !== undefined) {
        if (!data.name || data.name.trim() === "") {
          errors.push("Item name is required");
        } else {
          if (data.name.length < 2) {
            errors.push("Item name must be at least 2 characters");
          }
          if (data.name.length > 80) {
            errors.push("Item name cannot exceed 80 characters");
          }
        }
      } else if (!isUpdate) {
        errors.push("Item name is required");
      }
    }

    if (data.description !== undefined && data.description?.length > 1000) {
      errors.push("Description cannot exceed 1000 characters");
    }

    if (!isUpdate || data.price !== undefined) {
      if (data.price !== undefined) {
        if (typeof data.price !== "number" || Number.isNaN(data.price)) {
          errors.push("Price must be a valid number");
        } else if (data.price < 0.01) {
          errors.push("Price must be at least 0.01");
        } else if (data.price > 999999.99) {
          errors.push("Price cannot exceed 999,999.99");
        }
      } else if (!isUpdate) {
        errors.push("Price is required");
      }
    }

    if (data.prep_time_minutes !== undefined) {
      if (
        typeof data.prep_time_minutes !== "number" ||
        !Number.isInteger(data.prep_time_minutes)
      ) {
        errors.push("Preparation time must be an integer");
      } else if (data.prep_time_minutes < 0) {
        errors.push("Preparation time cannot be negative");
      } else if (data.prep_time_minutes > 240) {
        errors.push("Preparation time cannot exceed 240 minutes");
      }
    }

    if (data.status !== undefined && !ITEM_STATUSES.includes(data.status)) {
      errors.push(
        'Status must be either "available", "unavailable", or "sold_out"',
      );
    }

    if (
      data.is_chef_recommended !== undefined &&
      typeof data.is_chef_recommended !== "boolean"
    ) {
      errors.push("Chef recommendation must be true or false");
    }

    if (!isUpdate || data.category_id !== undefined) {
      if (data.category_id !== undefined) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.category_id)) {
          errors.push("Invalid category ID format");
        }
      } else if (!isUpdate) {
        errors.push("Category ID is required");
      }
    }

    return errors;
  }

  static async validateUpdateData(itemId, data) {
    const errors = this.validateItemData(data, true);
    const item = await MenuItem.findOne({
      where: { id: itemId, is_deleted: false },
    });

    if (!item) {
      errors.push("Item not found");
    }

    return errors;
  }
}
