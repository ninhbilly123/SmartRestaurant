import Table from '../../models/table.js';
import { TableService } from '../../services/table.service.js';
import { createTableSchema, updateTableSchema, updateTableStatusSchema } from '../../validators/table.validator.js';
import { validate } from '../../middlewares/validator.js';

// Lấy tất cả bàn
export const getAllTable = async (req, res) => {
  try {
    const tables = await TableService.getAll(req.query);
    
    res.json({ 
      success: true, 
      message: 'Get all tables from database',
      data: tables  
    });
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TableService.delete(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Table not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error deleting table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTableNameByID = async (req, res) => {
  console.log("---------- DEBUG GET TABLE NAME ----------");
  console.log("Request Params ID:", req.params.id);
  console.log("Full URL:", req.originalUrl);

  try {
    const { id } = req.params;
    
    if (!id) {
      console.log("DEBUG: ID bị thiếu trong params");
      return res.status(400).json({ success: false, message: "ID bàn không hợp lệ" });
    }

    const table = await TableService.getTableNameOnly(id);
    
    console.log("DEBUG: Query thành công, Table:", table);
    
    return res.json({ 
      success: true, 
      data: table 
    });
  } catch (error) {
    console.error("DEBUG ERROR tại Controller:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Lấy bàn theo ID 
export const getTableById = async (req, res) => {
  try {


    const { id } = req.params;
    const table = await Table.findByPk(id); //Tìm kiếm theo khóa chính
    

    if (!table) { //Sẽ trả về lỗi nếu không tìm thấy bàn
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Get table by ID: ${id}`,
      data: table 
    });
  } catch (error) {
    console.error('Error getting table by ID:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Tạo bàn mới 
export const createTable = [
  validate(createTableSchema), //validate dữ liệu đầu vào
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      
      // validate business logic
      const validationErrors = TableService.validateTableData(validatedData);
      if (validationErrors.length > 0) { //nếu có lỗi validate
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      const newTable = await TableService.create(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: 'Table created successfully',
        data: newTable 
      });
    } catch (error) {
      console.error('Error creating table:', error);
      
      // Xử lý lỗi cụ thể
      if (error.message === 'Table number already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];


export const updateTable = [
  validate(updateTableSchema),
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      const { id } = req.params;
      
      // Validate business logic
      const validationErrors = await TableService.validateUpdateData(id, validatedData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Cập nhật qua Service
      const updatedTable = await TableService.update(id, validatedData);
      
      res.status(200).json({
        success: true,
        message: 'Table updated successfully',
        data: updatedTable
      });
      
    } catch (error) {
      console.error('Error updating table:', error);
      
      // Xử lý lỗi từ Service
      if (error.message === 'Table not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message === 'Table number already exists') {
        return res.status(409).json({
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



export const updateTableStatus = [
  validate(updateTableStatusSchema),
  async (req, res) => {
    try {
      const validatedData = req.validatedData;
      const {id}  = req.params;

      const updatedTable = await TableService.updateStatus(id, validatedData.status);

      res.status(200).json({
        success: true,
        message: 'Table status updated successfully',
        data: updatedTable
      });
    } catch (error) {

      if (error.message === 'Table not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
    }
  }
];
