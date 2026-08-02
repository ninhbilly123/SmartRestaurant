import Customer from "../../../models/customer.js";
import customerService from "../../../services/customer.service.js";
import { uploadBufferToCloudinary } from "../../../../utils/cloudinary.js";

export const deleteAvatar = async (req, res) => {
  try {
    const customerId = req.user?.uid || req.user?.id;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    const result = await customerService.deleteAvatar(customerId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    let statusCode = 500;
    let errorMessage = "Lỗi server khi xóa avatar";

    if (error.message.includes("Không tìm thấy")) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message.includes("Cloudinary") || error.message.includes("upload")) {
      errorMessage = "Lỗi khi xóa ảnh trên Cloudinary";
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const customerId = req.user?.uid || req.user?.id;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh đại diện",
      });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const file = req.file;
    const filename = `avatar_${customerId}_${Date.now()}`;
    const folder = "restaurant/customer-avatars";
    const avatarUrl = await uploadBufferToCloudinary(file.buffer, folder, filename, {
      width: 200,
      height: 200,
      crop: "fill",
      gravity: "face",
      quality: "auto:best",
      format: "webp",
    });

    customer.avatar = avatarUrl;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật ảnh thành công",
      data: {
        avatar: avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật avatar",
    });
  }
};
