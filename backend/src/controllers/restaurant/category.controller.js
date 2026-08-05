import logger from "../../config/logger.js";
import { CategoryService } from "../../services/category.service.js";

export const getAllCategory = async (req, res) => {
  try {
    const categories = await CategoryService.getAll();

    return res.json({
      success: true,
      message: "Get all categories from database",
      data: categories,
    });
  } catch (error) {
    logger.error("Error getting categories:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const validationErrors = CategoryService.validateCategoryData(
      req.validatedData,
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const newCategory = await CategoryService.create(req.validatedData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    logger.error("Error creating category:", error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const validationErrors = await CategoryService.validateUpdateData(
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

    const updatedCategory = await CategoryService.update(id, req.validatedData);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    logger.error("Error updating category:", error);

    if (error.message === "Category not found") {
      return res.status(404).json({ success: false, message: error.message });
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

export const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.validatedData;
    const validationErrors = await CategoryService.validateStatusUpdate(
      id,
      status,
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot update category status",
        errors: validationErrors,
      });
    }

    const result = await CategoryService.updateStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Category status updated to "${status}" successfully`,
      data: {
        category: result.category,
        items_affected: result.metadata?.items_affected,
        previous_status: result.metadata?.previous_status,
      },
    });
  } catch (error) {
    logger.error("Error updating category status:", error);

    if (error.message === "Category not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryService.delete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: {
        id: category.id,
        name: category.name,
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error deleting category:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
