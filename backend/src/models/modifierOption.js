import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ModifierOption extends Model {}

ModifierOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "modifier_groups",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        len: [2, 80],
      },
    },
    price_adjustment: {
      type: DataTypes.DECIMAL(12, 2),
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
    tableName: "modifier_options",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["group_id"] },
      { fields: ["status"] },
    ],
  }
);

ModifierOption.associate = (models) => {
  ModifierOption.belongsTo(models.ModifierGroup, {
    foreignKey: "group_id",
    as: "group",
  });

  ModifierOption.hasMany(models.OrderItemModifier, {
    foreignKey: "modifier_option_id",
    as: "orderItemModifiers",
  });
};

export default ModifierOption;
