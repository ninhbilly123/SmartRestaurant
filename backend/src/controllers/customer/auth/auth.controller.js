import customerService from "../../../services/customer.service.js";
import customerValidator from "../../../validators/customer.validator.js";
import Customer from "../../../models/customer.js";

export const register = async (req, res) => {
  try {
    const { error } = customerValidator.register.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;
    const result = await customerService.register(username, email, password, "email");
    const customerData = result.customer.toJSON();
    delete customerData.password;

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
      data: {
        customer: {
          uid: customerData.uid,
          username: customerData.username,
          email: customerData.email,
          phone: customerData.phone || null,
          avatar: customerData.avatar || null,
          isEmailVerified: false,
        },
        accessToken: result.accessToken,
        needsVerification: true,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const syncGoogleUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email là bắt buộc",
      });
    }

    const result = await customerService.syncGoogleUser(
      username || email.split("@")[0],
      email,
      "google"
    );

    return res.status(200).json({
      success: true,
      message: "Đăng nhập Google thành công",
      data: {
        customer: {
          username: result.customer.username,
          email: result.customer.email,
          phone: result.customer.phone || null,
          avatar: result.customer.avatar || null,
        },
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Không thể đồng bộ với Google",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { error } = customerValidator.login.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    try {
      const result = await customerService.login(email, password);
      const customerData = result.customer.toJSON();
      delete customerData.password;

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          customer: customerData,
          accessToken: result.accessToken,
          isEmailVerified: true,
        },
      });
    } catch (loginError) {
      if (loginError.message === "EMAIL_NOT_VERIFIED") {
        const customer = await Customer.findOne({ where: { email } });

        if (customer) {
          return res.status(200).json({
            success: false,
            needsVerification: true,
            message: "Vui lòng xác thực email trước khi đăng nhập",
            data: {
              customerId: customer.uid,
              email: customer.email,
              username: customer.username,
            },
          });
        }
      }

      throw loginError;
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || "Đăng nhập thất bại",
    });
  }
};
