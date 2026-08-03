import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class VerifiedEmail extends Model {}

VerifiedEmail.init(
  {
    customer_uid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "customers",
        key: "uid",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    auth_method: {
      type: DataTypes.ENUM("email", "google"),
      allowNull: false,
      defaultValue: "email",
    },
    otp_code: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "VerifiedEmail",
    tableName: "verified_emails",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["customer_uid"],
      },
      {
        fields: ["email", "auth_method"],
      },
      {
        fields: ["otp_code"],
      },
    ],
    hooks: {
      beforeValidate: (verifiedEmail) => {
        if (verifiedEmail.otp_code) {
          verifiedEmail.otp_code = verifiedEmail.otp_code.padStart(6, "0");
        }
      },
    },
  }
);

VerifiedEmail.associate = (models) => {
  VerifiedEmail.belongsTo(models.Customer, {
    foreignKey: "customer_uid",
    targetKey: "uid",
    as: "customer",
  });
};

export default VerifiedEmail;
