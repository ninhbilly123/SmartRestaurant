import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "payment_request",
  "payment_pending",
  "completed",
  "cancelled",
];

const PAYMENT_METHODS = ["cash", "momo", "vnpay"];

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "customers",
        key: "uid",
      },
    },
    table_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tables",
        key: "id",
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    discount_type: {
      type: DataTypes.ENUM("percent", "fixed"),
      allowNull: true,
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: { min: 0 },
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    ordered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [PAYMENT_METHODS],
      },
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["customer_id"] },
      { fields: ["table_id"] },
      { fields: ["ordered_at"] },
      { fields: ["status"] },
    ],
  }
);

Order.associate = (models) => {
  Order.belongsTo(models.Customer, {
    foreignKey: "customer_id",
    targetKey: "uid",
    as: "customer",
  });

  Order.belongsTo(models.Table, {
    foreignKey: "table_id",
    as: "table",
  });

  Order.hasMany(models.OrderItem, {
    foreignKey: "order_id",
    as: "items",
  });

  Order.hasMany(models.MenuItemReview, {
    foreignKey: "order_id",
    as: "reviews",
  });
};

export { ORDER_STATUSES, PAYMENT_METHODS };
export default Order;
