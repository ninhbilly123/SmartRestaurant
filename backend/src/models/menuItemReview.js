import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItemReview extends Model {}

MenuItemReview.init(
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
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "customers",
        key: "uid",
      },
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_verified_purchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "MenuItemReview",
    tableName: "menu_item_reviews",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      { fields: ["menu_item_id"] },
      { fields: ["customer_id"] },
      { fields: ["order_id"] },
      {
        unique: true,
        fields: ["customer_id", "order_id", "menu_item_id"],
      },
    ],
  }
);

MenuItemReview.associate = (models) => {
  MenuItemReview.belongsTo(models.MenuItem, {
    foreignKey: "menu_item_id",
    as: "menu_item",
  });

  MenuItemReview.belongsTo(models.Customer, {
    foreignKey: "customer_id",
    targetKey: "uid",
    as: "customer",
  });

  MenuItemReview.belongsTo(models.Order, {
    foreignKey: "order_id",
    as: "order",
  });
};

export default MenuItemReview;
