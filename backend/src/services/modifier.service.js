import { Op } from "sequelize";
import sequelize from "../config/database.js";
import MenuItem from "../models/menuItem.js";
import MenuItemModifierGroup from "../models/menuItemModifierGroup.js";
import ModifierGroup from "../models/modifierGroup.js";
import ModifierOption from "../models/modifierOption.js";

const normalizeGroupIds = (groupIds = []) => [...new Set(groupIds.filter(Boolean))];

export class ModifierService {
  static async getAllGroups() {
    return ModifierGroup.findAll({
      include: [
        {
          model: ModifierOption,
          as: "options",
          required: false,
        },
      ],
      order: [
        ["display_order", "ASC"],
        ["created_at", "DESC"],
      ],
    });
  }

  static async getGroupById(id) {
    const group = await ModifierGroup.findByPk(id, {
      include: [
        {
          model: ModifierOption,
          as: "options",
          required: false,
        },
      ],
    });

    if (!group) {
      const error = new Error("Modifier group not found");
      error.status = 404;
      throw error;
    }

    return group;
  }

  static async createGroup(data) {
    const existingGroup = await ModifierGroup.findOne({
      where: { name: data.name },
    });

    if (existingGroup) {
      throw new Error("Modifier already exists");
    }

    return ModifierGroup.create({
      name: data.name,
      selection_type: data.selection_type,
      is_required: data.is_required,
      min_selections: data.min_selections,
      max_selections: data.max_selections,
      display_order: data.display_order,
      status: data.status,
    });
  }

  static async updateGroup(id, data) {
    const foundGroup = await ModifierGroup.findByPk(id);
    if (!foundGroup) {
      throw new Error("Modifier does not exist");
    }

    if (data.name && data.name !== foundGroup.name) {
      const existingGroupName = await ModifierGroup.findOne({
        where: {
          name: data.name,
          id: { [Op.ne]: id },
        },
      });

      if (existingGroupName) {
        throw new Error("Modifier name already exists");
      }
    }

    return foundGroup.update(data);
  }

  static async createOption(groupId, data) {
    const group = await ModifierGroup.findByPk(groupId);
    if (!group) {
      throw new Error("Modifier group not found");
    }

    const existingOption = await ModifierOption.findOne({
      where: {
        name: data.name,
        group_id: groupId,
      },
    });

    if (existingOption) {
      throw new Error("Option already exists");
    }

    return ModifierOption.create({
      group_id: groupId,
      name: data.name,
      price_adjustment: data.price_adjustment,
      status: data.status,
    });
  }

  static async updateOption(id, data) {
    const foundOption = await ModifierOption.findByPk(id);
    if (!foundOption) {
      throw new Error("Option not found");
    }

    if (data.name && data.name !== foundOption.name) {
      const existingOptionName = await ModifierOption.findOne({
        where: {
          name: data.name,
          group_id: foundOption.group_id,
          id: { [Op.ne]: id },
        },
      });

      if (existingOptionName) {
        throw new Error("Option name already exists");
      }
    }

    return foundOption.update(data);
  }

  static async attachGroupsToItem(menuItemId, groupIds) {
    const normalizedGroupIds = normalizeGroupIds(groupIds);
    const transaction = await sequelize.transaction();

    try {
      const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
      if (!menuItem) {
        throw new Error("Menu item not found");
      }

      if (normalizedGroupIds.length > 0) {
        const groups = await ModifierGroup.findAll({
          where: {
            id: { [Op.in]: normalizedGroupIds },
          },
          transaction,
        });

        if (groups.length !== normalizedGroupIds.length) {
          throw new Error("Some modifier groups were not found");
        }
      }

      await MenuItemModifierGroup.destroy({
        where: { menu_item_id: menuItemId },
        transaction,
      });

      if (normalizedGroupIds.length === 0) {
        await transaction.commit();
        return [];
      }

      const records = normalizedGroupIds.map((groupId) => ({
        menu_item_id: menuItemId,
        group_id: groupId,
      }));

      const created = await MenuItemModifierGroup.bulkCreate(records, {
        transaction,
      });

      await transaction.commit();
      return created;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async deleteGroup(id) {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
      const group = await ModifierGroup.findByPk(id, { transaction });
      if (!group) {
        const error = new Error("Modifier group not found");
        error.status = 404;
        throw error;
      }

      await ModifierOption.update(
        { status: "inactive" },
        { where: { group_id: id }, transaction },
      );
      await MenuItemModifierGroup.destroy({
        where: { group_id: id },
        transaction,
      });
      await group.update({ status: "inactive" }, { transaction });

      await transaction.commit();
      committed = true;
      return group;
    } catch (error) {
      if (!committed) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  static async deleteOption(id) {
    const option = await ModifierOption.findByPk(id);
    if (!option) {
      const error = new Error("Modifier option not found");
      error.status = 404;
      throw error;
    }

    await option.update({ status: "inactive" });
    return option;
  }
}
