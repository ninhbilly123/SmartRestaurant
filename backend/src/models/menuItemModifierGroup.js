import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItemModifierGroup extends Model {}

MenuItemModifierGroup.init(
  {
    menu_item_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "menu_items",
        key: "id",
      },
    },
    group_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "modifier_groups",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "menu_item_modifier_groups",
    timestamps: false,
    indexes: [
      { fields: ["menu_item_id"] },
      { fields: ["group_id"] },
    ],
  }
);

MenuItemModifierGroup.associate = (models) => {
  MenuItemModifierGroup.belongsTo(models.MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
  });

  MenuItemModifierGroup.belongsTo(models.ModifierGroup, {
    foreignKey: "group_id",
    as: "modifierGroup",
  });
};

export default MenuItemModifierGroup;
