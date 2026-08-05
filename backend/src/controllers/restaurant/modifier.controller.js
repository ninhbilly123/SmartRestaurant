import logger from "../../config/logger.js";
import { ModifierService } from "../../services/modifier.service.js";

export const getAllModifierGroups = async (req, res) => {
  try {
    const groups = await ModifierService.getAllGroups();

    return res.json({
      success: true,
      message: "Get all modifier groups",
      data: groups,
    });
  } catch (error) {
    logger.error("Error getting modifier groups:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getModifierGroupById = async (req, res) => {
  try {
    const group = await ModifierService.getGroupById(req.params.id);

    return res.json({
      success: true,
      message: `Get modifier group by ID: ${req.params.id}`,
      data: group,
    });
  } catch (error) {
    logger.error("Error getting modifier group:", error);
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
};

export const createModifierGroup = async (req, res) => {
  try {
    const newGroup = await ModifierService.createGroup(req.validatedData);

    return res.status(201).json({
      success: true,
      message: "New group created successfully",
      data: newGroup,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updateModifierGroup = async (req, res) => {
  try {
    const updatedGroup = await ModifierService.updateGroup(
      req.params.id,
      req.validatedData,
    );

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const createModifierOption = async (req, res) => {
  try {
    const newOption = await ModifierService.createOption(
      req.params.id,
      req.validatedData,
    );

    return res.status(201).json({
      success: true,
      message: "New option created successfully",
      data: newOption,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updateModifierOption = async (req, res) => {
  try {
    const updatedOption = await ModifierService.updateOption(
      req.params.id,
      req.validatedData,
    );

    return res.status(200).json({
      success: true,
      message: "Option updated successfully",
      data: updatedOption,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const attachModifierGroup = async (req, res) => {
  try {
    const result = await ModifierService.attachGroupsToItem(
      req.params.id,
      req.validatedData.groupIds,
    );

    return res.status(200).json({
      success: true,
      message: "Modifier groups updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteModifierGroup = async (req, res) => {
  try {
    await ModifierService.deleteGroup(req.params.id);

    return res.json({
      success: true,
      message: "Modifier group deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting modifier group:", error);
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
};

export const deleteModifierOption = async (req, res) => {
  try {
    await ModifierService.deleteOption(req.params.id);

    return res.json({
      success: true,
      message: "Modifier option deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting modifier option:", error);
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
};
