import { Op } from "sequelize";
import logger from "../config/logger.js";
import db from "../models/index.js";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary.js";

const { MenuItem, MenuItemPhoto, sequelize } = db;

const MAX_PHOTOS_PER_ITEM = 10;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildFileName = (menuItemId) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `menu-${menuItemId}-${timestamp}-${randomStr}`;
};

const cleanupCloudinaryUrls = async (urls) => {
  await Promise.allSettled(urls.map((url) => deleteFromCloudinary(url)));
};

class MenuItemPhotoService {
  async uploadPhotosWithTransaction(menuItemId, files, transaction) {
    const uploadedUrls = [];
    const createdPhotos = [];

    try {
      const existingCount = await MenuItemPhoto.count({
        where: { menu_item_id: menuItemId },
        transaction,
      });

      if (existingCount + files.length > MAX_PHOTOS_PER_ITEM) {
        throw createError("Moi mon chi duoc toi da 10 anh");
      }

      const shouldSetPrimary = existingCount === 0;

      for (const [index, file] of files.entries()) {
        if (!file.buffer) continue;

        const url = await uploadBufferToCloudinary(
          file.buffer,
          `menu-items/${menuItemId}`,
          buildFileName(menuItemId),
        );
        uploadedUrls.push(url);

        const photo = await MenuItemPhoto.create(
          {
            menu_item_id: menuItemId,
            url,
            is_primary: shouldSetPrimary && index === 0,
          },
          { transaction },
        );

        createdPhotos.push(photo);
      }

      return createdPhotos;
    } catch (error) {
      await cleanupCloudinaryUrls(uploadedUrls);
      throw error;
    }
  }

  async uploadPhotos(menuItemId, files) {
    const uploadedUrls = [];
    const transaction = await sequelize.transaction();

    try {
      const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
      if (!menuItem) {
        throw createError(`Menu item ${menuItemId} khong ton tai`, 404);
      }

      const existingCount = await MenuItemPhoto.count({
        where: { menu_item_id: menuItemId },
        transaction,
      });

      if (existingCount + files.length > MAX_PHOTOS_PER_ITEM) {
        throw createError("Moi mon chi duoc toi da 10 anh");
      }

      const shouldSetPrimary = existingCount === 0;
      const createdPhotos = [];

      for (const [index, file] of files.entries()) {
        if (!file.buffer) continue;

        const url = await uploadBufferToCloudinary(
          file.buffer,
          `menu-items/${menuItemId}`,
          buildFileName(menuItemId),
        );
        uploadedUrls.push(url);

        const photo = await MenuItemPhoto.create(
          {
            menu_item_id: menuItemId,
            url,
            is_primary: shouldSetPrimary && index === 0,
          },
          { transaction },
        );

        createdPhotos.push(photo);
      }

      await transaction.commit();
      return createdPhotos;
    } catch (error) {
      await transaction.rollback();
      await cleanupCloudinaryUrls(uploadedUrls);
      throw error;
    }
  }

  async deletePhoto(menuItemId, photoId) {
    const transaction = await sequelize.transaction();
    let photoUrl = null;

    try {
      const photo = await MenuItemPhoto.findOne({
        where: { id: photoId, menu_item_id: menuItemId },
        transaction,
      });

      if (!photo) {
        throw createError("Anh khong ton tai", 404);
      }

      photoUrl = photo.url;

      if (photo.is_primary) {
        const nextPhoto = await MenuItemPhoto.findOne({
          where: {
            menu_item_id: menuItemId,
            id: { [Op.ne]: photoId },
          },
          order: [["created_at", "ASC"]],
          transaction,
        });

        if (nextPhoto) {
          await nextPhoto.update({ is_primary: true }, { transaction });
        }
      }

      await photo.destroy({ transaction });
      await transaction.commit();

      await deleteFromCloudinary(photoUrl).catch((error) => {
        logger.warn("Cloudinary photo cleanup failed after DB delete:", {
          menuItemId,
          photoId,
          error: error.message,
        });
      });

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async setPrimaryPhoto(menuItemId, photoId) {
    const transaction = await sequelize.transaction();

    try {
      const photo = await MenuItemPhoto.findOne({
        where: { id: photoId, menu_item_id: menuItemId },
        transaction,
      });

      if (!photo) {
        throw createError("Anh khong ton tai", 404);
      }

      await MenuItemPhoto.update(
        { is_primary: false },
        { where: { menu_item_id: menuItemId }, transaction },
      );

      await photo.update({ is_primary: true }, { transaction });

      await transaction.commit();
      return photo;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new MenuItemPhotoService();
