import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ModifierGroup extends Model {}

ModifierGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        len: [2, 80],
      },
    },
    selection_type: {
      type: DataTypes.ENUM("single", "multiple"),
      defaultValue: "single",
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    min_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    max_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    tableName: "modifier_groups",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["status"] },
      { fields: ["display_order"] },
    ],
  }
);

ModifierGroup.associate = (models) => {
  ModifierGroup.hasMany(models.ModifierOption, {
    foreignKey: "group_id",
    as: "options",
    onDelete: "CASCADE",
  });

  ModifierGroup.belongsToMany(models.MenuItem, {
    through: models.MenuItemModifierGroup,
    foreignKey: "group_id",
    otherKey: "menu_item_id",
    as: "menuItems",
  });
};

export default ModifierGroup;
