import { Op } from "sequelize";
import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService from "../otp.service.js";
import emailService from "../email.service.js";
import logger from "../../config/logger.js";

export const updateCustomerProfile = async (uid, updateData) => {
  try {
    const customer = await Customer.findByPk(uid);
    if (!customer) throw new Error("Không tìm thấy tài khoản");

    const allowedUpdates = {};

    if (updateData.username !== undefined) {
      const newUsername = updateData.username.trim();

      if (newUsername !== customer.username) {
        const exists = await Customer.findOne({
          where: {
            username: newUsername,
            uid: { [Op.ne]: uid },
          },
        });

        if (exists) throw new Error("Username đã tồn tại");
        if (newUsername.length < 3 || newUsername.length > 30) {
          throw new Error("Username phải từ 3-30 ký tự");
        }

        allowedUpdates.username = newUsername;
      }
    }

    if (updateData.phone !== undefined) {
      const newPhone = updateData.phone.trim();

      if (newPhone !== customer.phone) {
        if (!/^[0-9]+$/.test(newPhone)) {
          throw new Error("Số điện thoại chỉ được chứa chữ số");
        }

        if (newPhone.length !== 10) {
          throw new Error("Số điện thoại phải có đúng 10 chữ số");
        }

        allowedUpdates.phone = newPhone;
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error("Không có thông tin nào để cập nhật");
    }

    await customer.update(allowedUpdates);

    const updatedCustomer = await Customer.findByPk(uid, {
      attributes: { exclude: ["password"] },
    });

    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      customer: updatedCustomer,
    };
  } catch (error) {
    logger.error("Update customer profile error:", error);
    throw error;
  }
};

export const updateAvatar = async (uid, avatarUrl) => {
  try {
    const customer = await Customer.findByPk(uid);
    if (!customer) throw new Error("Không tìm thấy tài khoản");

    if (!avatarUrl || typeof avatarUrl !== "string") {
      throw new Error("URL avatar không hợp lệ");
    }

    await customer.update({ avatar: avatarUrl });

    return {
      success: true,
      message: "Cập nhật ảnh đại diện thành công",
      avatarUrl,
    };
  } catch (error) {
    logger.error("Update avatar error:", error);
    throw error;
  }
};

export const deleteAvatar = async (uid) => {
  try {
    const customer = await Customer.findByPk(uid);
    if (!customer) throw new Error("Không tìm thấy tài khoản");

    await customer.update({ avatar: null });

    return {
      success: true,
      message: "Xóa ảnh đại diện thành công",
      data: {
        avatar: null,
      },
    };
  } catch (error) {
    logger.error("Delete avatar error:", error);
    throw error;
  }
};

export const getCustomer = async (uid) => {
  const customer = await Customer.findByPk(uid, {
    attributes: { exclude: ["password"] },
  });

  if (!customer) throw new Error("Tài khoản không tồn tại");
  return customer;
};

export const getCustomerByUid = async (uid) => {
  const customer = await Customer.findByPk(uid, {
    attributes: { exclude: ["password"] },
  });

  if (!customer) throw new Error("Không tìm thấy tài khoản");
  return customer;
};

export const updateCustomer = async (uid, updateData) => {
  const customer = await Customer.findByPk(uid);
  if (!customer) throw new Error("Không tìm thấy tài khoản");

  if (updateData.username && updateData.username !== customer.username) {
    const exists = await Customer.findOne({
      where: { username: updateData.username },
    });
    if (exists) throw new Error("Username đã tồn tại");
  }

  if (updateData.email && updateData.email !== customer.email) {
    const exists = await Customer.findOne({
      where: { email: updateData.email },
    });
    if (exists) throw new Error("Email đã được sử dụng");

    const otp = OTPService.generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    await VerifiedEmail.create({
      customer_uid: customer.uid,
      email: updateData.email,
      otp_code: OTPService.hashCredential(otp),
      otp_expires: otpExpires,
      is_verified: false,
    });

    await emailService.sendOTPEmail(updateData.email, otp, customer.username);

    await VerifiedEmail.update(
      { is_verified: false },
      {
        where: {
          customer_uid: customer.uid,
          email: customer.email,
        },
      }
    );
  }

  await customer.update(updateData);
  return customer;
};
