import MenuCategory from "../../models/menuCategory.js";
import db from "../../models/index.js";
import MenuItem from "../../models/menuItem.js";
import OrderItem from "../../models/orderItem.js";
import { Op, fn, col } from "sequelize";

import { ItemService } from "../../services/menuItem.service.js";
import menuItemPhotoService from "../../services/menuItemPhoto.service.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateMenuItemStatusSchema,
} from "../../validators/item.validator.js";
import { validate } from "../../middlewares/validator.js";
import logger from "../../config/logger.js";

const { MenuItemPhoto, sequelize } = db;

//LẤY TẤT CẢ ITEM
export const getAllItem = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      // Vẫn phải giữ đoạn này để Frontend có ảnh mà hiển thị
      include: [
        {
          model: MenuItemPhoto,
          as: "photos", // Alias khớp với model
          attributes: ["id", "url", "is_primary"],
        },
        {
          model: MenuCategory,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Lấy popularity count cho tất cả items
    const itemIds = menuItems.map((item) => item.id);
    let popularityMap = {};

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

      popularityCounts.forEach((pc) => {
        popularityMap[pc.menu_item_id] = parseInt(pc.order_count) || 0;
      });
    }

    // Thêm popularity vào mỗi item
    const itemsWithPopularity = menuItems.map((item) => ({
      ...item.toJSON(),
      popularity: popularityMap[item.id] || 0,
    }));

    res.json({
      success: true,
      message: "Get all menuItem from database",
      data: itemsWithPopularity,
    });
  } catch (error) {
    console.error("Error getting menuItem:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//LẤY ITEM THEO ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByPk(id, {
      include: [
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
        {
          model: db.ModifierGroup,
          as: "modifierGroups",
          include: [
            {
              model: db.ModifierOption,
              as: "options",
              attributes: ["id", "name", "price_adjustment", "status"],
            },
          ],
        },
      ],
    });

    if (!item) {
      //Sẽ trả về lỗi nếu không tìm thấy item
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      message: `Get item by ID: ${id}`,
      data: item,
    });
  } catch (error) {
    console.error("Error getting item by ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//TẠO ITEM MỚI (hỗ trợ cả JSON và multipart/form-data với photos)
export const createItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Parse data từ form-data hoặc JSON body
    let itemData;
    if (req.body.itemData) {
      // Nếu gửi qua form-data, itemData sẽ là JSON string
      itemData =
        typeof req.body.itemData === "string"
          ? JSON.parse(req.body.itemData)
          : req.body.itemData;
    } else {
      // Nếu gửi qua JSON body (không có photos)
      itemData = req.body;
    }

    // Validate business logic
    const validationErrors = ItemService.validateItemData(itemData);
    if (validationErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Tạo item mới
    const newItem = await ItemService.create(itemData, transaction);

    // Upload photos nếu có
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = await menuItemPhotoService.uploadPhotosWithTransaction(
        newItem.id,
        req.files,
        transaction,
      );
    }

    await transaction.commit();

    // Fetch lại item với photos để trả về
    const itemWithPhotos = await MenuItem.findByPk(newItem.id, {
      include: [
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
      ],
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: itemWithPhotos,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating item:", error);

    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//CẬP NHẬT ITEM
export const updateItem = [
  validate(updateMenuItemSchema),
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      const { id } = req.params;

      // Validate business logic
      const validationErrors = await ItemService.validateUpdateData(
        id,
        validatedData,
      );
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      // Cập nhật qua Service
      const updatedItem = await ItemService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: "Item updated successfully",
        data: updatedItem,
      });
    } catch (error) {
      console.error("Error updating item:", error);

      // Xử lý lỗi từ Service
      if (error.message === "Item not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === "No data provided for update") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
];

export const deleteItem = [
  async (req, res) => {
    try {
      const { id } = req.params; // id của menu item

      // 1. Tìm item
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
        return res.status(404).json({
          success: false,
          message: "Menu item not found or already deleted",
        });
      }

      // 2. Lấy category_id từ item
      const category_id = item.category_id;

      logger.info(`Deleting item ${id} from category ${category_id}`);

      // 3. Soft delete item
      await item.update({
        is_deleted: true,
        deleted_at: new Date(),
      });

      // 4. (Optional) Cập nhật số lượng items trong category
      const activeItemsCount = await MenuItem.count({
        where: {
          category_id: category_id,
          is_deleted: false,
          status: "active",
        },
      });

      res.status(200).json({
        success: true,
        message: "Menu item deleted successfully",
        data: {
          id: item.id,
          name: item.name,
          category_id: category_id,
          category_name: item.category?.name,
          remaining_items_in_category: activeItemsCount,
          deleted_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);

      // Xử lý lỗi database
      if (error.name === "SequelizeDatabaseError") {
        return res.status(400).json({
          success: false,
          message: "Database error occurred",
        });
      }

      // Lỗi validation từ Sequelize
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
];
