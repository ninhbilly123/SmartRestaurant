const getErrorField = (detail) => detail.path.join(".") || "value";

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: getErrorField(detail),
        message: detail.message.replace(/['"]/g, ""),
      }));

      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    req[source] = value;
    req.validatedData = value;
    return next();
  };
};
