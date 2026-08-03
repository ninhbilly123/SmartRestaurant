import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItemPhoto extends Model {}

MenuItemPhoto.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    menu_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "menu_items",
        key: "id",
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "menu_item_photos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["menu_item_id"] },
      { fields: ["is_primary"] },
    ],
  }
);

MenuItemPhoto.associate = (models) => {
  MenuItemPhoto.belongsTo(models.MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
    onDelete: "CASCADE",
  });
};

export default MenuItemPhoto;
