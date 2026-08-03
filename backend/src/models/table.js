import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Table extends Model {}

Table.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    table_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 20,
      },
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
      validate: {
        isIn: [["active", "inactive"]],
      },
    },
    qr_token: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    qr_token_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "tables",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["status"],
      },
    ],
  }
);

Table.associate = (models) => {
  Table.hasMany(models.Order, {
    foreignKey: "table_id",
    as: "orders",
  });
};

export default Table;
