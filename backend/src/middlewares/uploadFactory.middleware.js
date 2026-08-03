import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const normalizeExtension = (value = "") =>
  value.toLowerCase().replace(/^\./, "").replace("jpg", "jpeg");

export const createMemoryImageUploader = ({
  allowedExtensions = ["jpeg", "jpg", "png", "webp"],
  maxFileSizeMb = 5,
  maxFiles = 1,
} = {}) => {
  const allowedTypes = new Set(allowedExtensions.map(normalizeExtension));

  const fileFilter = (req, file, cb) => {
    const extname = normalizeExtension(path.extname(file.originalname));
    const mimetype = normalizeExtension(file.mimetype.split("/").pop());

    if (allowedTypes.has(extname) && allowedTypes.has(mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error(`Chỉ cho phép file ảnh (${allowedExtensions.join(", ")})`)
    );
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
      files: maxFiles,
    },
  });
};

export const createUploadErrorHandler = ({
  fieldName,
  maxFileSizeMb = 5,
  maxFiles = 1,
} = {}) => {
  const sendBadRequest = (res, message) =>
    res.status(400).json({
      success: false,
      message,
      error: message,
    });

  return (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendBadRequest(
          res,
          `File ảnh quá lớn. Tối đa ${maxFileSizeMb}MB mỗi file`
        );
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return sendBadRequest(res, `Tối đa ${maxFiles} file mỗi lần upload`);
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE" && fieldName) {
        return sendBadRequest(
          res,
          `Trường upload phải có tên là "${fieldName}"`
        );
      }
    }

    if (err) {
      return sendBadRequest(res, err.message || "Lỗi upload file");
    }

    return next();
  };
};
