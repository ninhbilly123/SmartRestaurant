import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";
import VerifiedEmail from "./verifiedEmail.js"; 

class Customer extends Model {
  async comparePassword(candidatePassword) {
      // Nếu là Google user (không có password)
      if (this.auth_method === 'google') {
        return false; 
      }
      
      if (!this.password) {
        throw new Error("Tài khoản không có mật khẩu. Vui lòng đặt lại mật khẩu.");
      }
      
      if (!candidatePassword) {
        return false;
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
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      validate: {
        isEmail: true
      }
    },
    auth_method: {
      type: DataTypes.ENUM('email', 'google'),
      allowNull: true,
      defaultValue: 'email',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // ========== THÊM CÁC TRƯỜNG MỚI ĐÂY ==========
    
    // Trường phone cho cập nhật profile
    phone: {
      type: DataTypes.STRING(10),           
      allowNull: true,
      unique: false,                       
      validate: {
        len: {
          args: [10, 10],                   
          msg: "Số điện thoại phải có đúng 10 chữ số"
        },
        is: {
          args: /^[0-9]+$/,                
          msg: "Số điện thoại chỉ được chứa chữ số"
        }
      }
    },

    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
     },
    
    // Các trường khác nếu cần (có thể thêm sau)
    // fullName: {
    //   type: DataTypes.STRING(100),
    //   allowNull: true,
    // },
    // address: {
    //   type: DataTypes.TEXT,
    //   allowNull: true,
    // },
    // dateOfBirth: {
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // },
    // avatar: {
    //   type: DataTypes.STRING(500),
    //   allowNull: true,
    // },
    // ========== KẾT THÚC THÊM ==========
    
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (customer) => {
        // CHỈNH SỬA: Chỉ hash password nếu có password
        if (customer.password) {
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
        }
      },
      beforeUpdate: async (customer) => {
        // CHỈNH SỬA: Chỉ hash password nếu có password thay đổi
        if (customer.changed('password') && customer.password) {
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
        }
      },
      afterUpdate: async (customer) => {
        if (customer.changed('email')) {
          await VerifiedEmail.create({
            customer_uid: customer.uid,
            email: customer.email,
            is_verified: false
          });
        }
      }
    }
  }
);

// Thiết lập quan hệ
Customer.hasMany(VerifiedEmail, {
  foreignKey: 'customer_uid',
  sourceKey: 'uid',
  as: 'verifiedEmails'
});

VerifiedEmail.belongsTo(Customer, {
  foreignKey: 'customer_uid',
  targetKey: 'uid',
  as: 'customer'
});

export default Customer;
