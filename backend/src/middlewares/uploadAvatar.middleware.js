import {
  createMemoryImageUploader,
  createUploadErrorHandler,
} from "./uploadFactory.middleware.js";

const avatarUploader = createMemoryImageUploader({
  allowedExtensions: ["jpeg", "jpg", "png", "webp", "gif"],
  maxFileSizeMb: 5,
  maxFiles: 1,
});

export const uploadAvatar = avatarUploader.single("avatar");

export const handleAvatarUploadErrors = createUploadErrorHandler({
  fieldName: "avatar",
  maxFileSizeMb: 5,
  maxFiles: 1,
});

export default {
  uploadAvatar,
  handleAvatarUploadErrors,
};
