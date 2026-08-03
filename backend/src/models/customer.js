import bcrypt from "bcryptjs";
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Customer extends Model {
  async comparePassword(candidatePassword) {
    if (this.auth_method === "google" || !candidatePassword) {
      return false;
    }

    if (!this.password) {
      throw new Error(
        "Tài khoản không có mật khẩu. Vui lòng đặt lại mật khẩu."
      );
    }

    return bcrypt.compare(candidatePassword, this.password);
  }
}

Customer.init(
  {
    uid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        len: {
          args: [10, 10],
          msg: "Số điện thoại phải có đúng 10 chữ số",
        },
        is: {
          args: /^[0-9]+$/,
          msg: "Số điện thoại chỉ được chứa chữ số",
        },
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["email", "auth_method"],
      },
    ],
    hooks: {
      beforeValidate: (customer) => {
        if (!customer.full_name && customer.username) {
          customer.full_name = customer.username;
        }
      },
      beforeCreate: async (customer) => {
        if (customer.password) {
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
        }
      },
      beforeUpdate: async (customer) => {
        if (customer.changed("password") && customer.password) {
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
        }
      },
      afterUpdate: async (customer) => {
        if (!customer.changed("email")) return;

        const { VerifiedEmail } = sequelize.models;
        if (!VerifiedEmail) return;

        await VerifiedEmail.create({
          customer_uid: customer.uid,
          email: customer.email,
          auth_method: customer.auth_method,
          is_verified: false,
        });
      },
    },
    scopes: {
      withoutPassword: {
        attributes: { exclude: ["password"] },
      },
    },
  }
);

Customer.associate = (models) => {
  Customer.hasMany(models.VerifiedEmail, {
    foreignKey: "customer_uid",
    sourceKey: "uid",
    as: "verifiedEmails",
  });

  Customer.hasMany(models.Order, {
    foreignKey: "customer_id",
    sourceKey: "uid",
    as: "orders",
  });

  Customer.hasMany(models.MenuItemReview, {
    foreignKey: "customer_id",
    sourceKey: "uid",
    as: "reviews",
  });
};

export default Customer;
