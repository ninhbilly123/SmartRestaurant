import customerService from "../../../services/customer.service.js";
import customerValidator from "../../../validators/customer.validator.js";

export const updateProfile = async (req, res) => {
  try {
    const uid = req.customer?.uid || req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "Không tìm thấy thông tin người dùng",
      });
    }

    const { error } = customerValidator.update.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const allowedFields = ["username", "phone"];
    const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Chỉ được phép cập nhật username và phone. Trường không hợp lệ: ${invalidFields.join(", ")}`,
      });
    }

    const result = await customerService.updateCustomerProfile(uid, req.body);

    return res.status(200).json({
      success: true,
      message: result.message || "Cập nhật thông tin thành công",
      data: {
        customer: result.customer,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "Không tìm thấy thông tin người dùng trong request",
      });
    }

    const customer = await customerService.getCustomer(uid);
    const customerData = customer.toJSON ? customer.toJSON() : customer;

    return res.status(200).json({
      success: true,
      data: {
        customer: {
          uid: customerData.uid,
          username: customerData.username,
          email: customerData.email,
          fullName: customerData.fullName || null,
          phone: customerData.phone || null,
          address: customerData.address || null,
          avatar: customerData.avatar || null,
          dateOfBirth: customerData.dateOfBirth || null,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
        },
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error.message || "Không thể lấy thông tin",
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "Không tìm thấy thông tin người dùng",
      });
    }

    const { error } = customerValidator.update.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const updatedCustomer = await customerService.updateCustomer(uid, req.body);
    const customerData = updatedCustomer.toJSON();
    delete customerData.password;

    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: {
        customer: customerData,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
