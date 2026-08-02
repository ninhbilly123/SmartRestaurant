
import MenuCategory from '../../models/menuCategory.js';
import MenuItem from '../../models/menuItem.js';

import { CategoryService } from '../../services/category.service.js';
import {createCategorySchema, updateCategorySchema, updateCategoryStatusSchema } from '../../validators/category.validator.js'
import { validate } from '../../middlewares/validator.js';
import logger from '../../config/logger.js';



//Lấy tất cả các danh mục từ database
export const getAllCategory = async (req, res) => {
  try {
    const categories = await MenuCategory.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      message: 'Get all categories from database',
      data: categories  
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


//Tạo danh mục mới 
export const createCategory = [
  validate(createCategorySchema), //validate dữ liệu đầu vào
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      
      // validate business logic
      const validationErrors = CategoryService.validateCategoryData(validatedData);
      if (validationErrors.length > 0) { //nếu có lỗi validate
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      const newCategory = await CategoryService.create(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: 'Category created successfully',
        data: newCategory 
      });
    } catch (error) {
      console.error('Error creating category:', error);

      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];


//Cập nhật Category
export const updateCategory = [
  validate(updateCategorySchema),
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      const { id } = req.params;

      // Validate business logic
      const validationErrors = await CategoryService.validateUpdateData(id, validatedData);
      if (validationErrors.length > 0) {
        logger.warn("Category validation failed:", validationErrors);
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Cập nhật qua Service
      const updatedCategory = await CategoryService.update(id, validatedData);
      
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
      
    } catch (error) {
      console.error('Error updating category:', error);
      
      // Xử lý lỗi từ Service
      if (error.message === 'Category not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message === 'No data provided for update') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }

 
];


// src/controllers/categoryController.js
export const updateCategoryStatus = [
  validate(updateCategoryStatusSchema),
  async (req, res) => {
    try {
      const { status } = req.validatedData;
      const { id } = req.params;
      logger.info(`Updating status of category ${id} to "${status}"`);
      
      // Validate business logic
      const validationErrors = await CategoryService.validateStatusUpdate(
        id, 
        status, 
      );
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update category status',
          errors: validationErrors
        });
      }
      
      // Update status qua Service
      const result = await CategoryService.updateStatus(id, status);
      
      res.status(200).json({
        success: true,
        message: `Category status updated to "${status}" successfully`,
        data: {
          category: result.category,
          items_affected: result.metadata?.items_affected,
          previous_status: result.metadata?.previous_status
        }
      });
      
    } catch (error) {
      console.error('Error updating category status:', error);
      
      // Xử lý lỗi cụ thể
      if (error.message === 'Category not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];


// src/controllers/categoryController.js
export const deleteCategory = [
    async (req, res) => {
      try {
        const { id } = req.params;
        
        // 1. Tìm category với điều kiện restaurantId
        const category = await MenuCategory.findOne({
          where: { 
            id, 
            status : 'active'
          }
        });
        
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found or already deleted'
          });
        }
        
        // 2. Kiểm tra nếu category có active items
        const activeItemsCount = await MenuItem.count({
          where: {
            category_id: id,
            status : 'active'
    
          }
        });
        
        if (activeItemsCount > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot delete category. It contains ${activeItemsCount} active menu items.`
          });
        }
        
        // 3. SOFT DELETE: Cập nhật thay vì xóa
        await category.update({
          is_deleted: true,
          status: 'inactive',
          deleted_at: new Date()
        });
        
        res.status(200).json({
          success: true,
          message: 'Category deleted successfully',
          data: {
            id: category.id,
            name: category.name,
            deleted_at: new Date().toISOString()
          }
        });
        
      } catch (error) {
        console.error('Error deleting category:', error);
        
        res.status(500).json({ 
          success: false, 
          message: 'Internal server error'
        });
      }
    }
];




