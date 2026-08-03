import {
  createMemoryImageUploader,
  createUploadErrorHandler,
} from "./uploadFactory.middleware.js";

const menuItemPhotoUploader = createMemoryImageUploader({
  allowedExtensions: ["jpeg", "jpg", "png", "webp"],
  maxFileSizeMb: 5,
  maxFiles: 5,
});

export const uploadMenuItemPhotos = menuItemPhotoUploader.array("photos", 5);

export const handleUploadErrors = createUploadErrorHandler({
  fieldName: "photos",
  maxFileSizeMb: 5,
  maxFiles: 5,
});
