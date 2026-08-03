import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

const ORDER_ITEM_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "cancelled",
];

class OrderItem extends Model {}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },
    menu_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "menu_items",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    price_at_order: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(...ORDER_ITEM_STATUSES),
      defaultValue: "pending",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ["order_id"] },
      { fields: ["menu_item_id"] },
      { fields: ["status"] },
    ],
  }
);

OrderItem.associate = (models) => {
  OrderItem.belongsTo(models.Order, {
    foreignKey: "order_id",
    as: "order",
  });

  OrderItem.belongsTo(models.MenuItem, {
    foreignKey: "menu_item_id",
    as: "menu_item",
    constraints: false,
  });

  OrderItem.hasMany(models.OrderItemModifier, {
    foreignKey: "order_item_id",
    as: "modifiers",
    onDelete: "CASCADE",
  });
};

export { ORDER_ITEM_STATUSES };
export default OrderItem;
