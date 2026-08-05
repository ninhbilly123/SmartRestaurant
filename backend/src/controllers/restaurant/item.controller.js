import db from "../../models/index.js";
import logger from "../../config/logger.js";
import { ItemService } from "../../services/menuItem.service.js";
import menuItemPhotoService from "../../services/menuItemPhoto.service.js";

const { sequelize } = db;

const parseItemPayload = (req) => {
  if (!req.body.itemData) return req.body;
  return typeof req.body.itemData === "string"
    ? JSON.parse(req.body.itemData)
    : req.body.itemData;
};

const sendError = (res, error, fallback = "Internal server error") => {
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || fallback,
  });
};

export const getAllItem = async (req, res) => {
  try {
    const items = await ItemService.getAll();

    return res.json({
      success: true,
      message: "Get all menu items from database",
      data: items,
    });
  } catch (error) {
    logger.error("Error getting menu items:", error);
    return sendError(res, error);
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await ItemService.getById(req.params.id);

    return res.json({
      success: true,
      message: `Get item by ID: ${req.params.id}`,
      data: item,
    });
  } catch (error) {
    logger.error("Error getting item by ID:", error);
    return sendError(res, error);
  }
};

export const createItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const itemData = parseItemPayload(req);
    const validationErrors = ItemService.validateItemData(itemData);

    if (validationErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const newItem = await ItemService.create(itemData, transaction);

    if (req.files?.length > 0) {
      await menuItemPhotoService.uploadPhotosWithTransaction(
        newItem.id,
        req.files,
        transaction,
      );
    }

    await transaction.commit();

    const itemWithPhotos = await ItemService.getById(newItem.id);

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: itemWithPhotos,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    logger.error("Error creating item:", error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateItem = async (req, res) => {
  try {
    const validationErrors = await ItemService.validateUpdateData(
      req.params.id,
      req.validatedData,
    );

    if (validationErrors.length > 0) {
      return res.status(validationErrors.includes("Item not found") ? 404 : 400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const updatedItem = await ItemService.update(req.params.id, req.validatedData);

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    logger.error("Error updating item:", error);
    return sendError(res, error);
  }
};

export const deleteItem = async (req, res) => {
  try {
    const deletedItem = await ItemService.delete(req.params.id);
    logger.info(
      `Deleted item ${req.params.id} from category ${deletedItem.category_id}`,
    );

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    logger.error("Error deleting menu item:", error);
    return sendError(res, error);
  }
};
