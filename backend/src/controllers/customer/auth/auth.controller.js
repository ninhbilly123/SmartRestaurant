import Customer from "../../../models/customer.js";
import customerService from "../../../services/customer.service.js";
import customerValidator from "../../../validators/customer.validator.js";

const toPublicCustomer = (customer) => {
  const data = customer?.toJSON ? customer.toJSON() : customer;
  if (!data) return null;

  return {
    uid: data.uid,
    username: data.username,
    email: data.email,
    full_name: data.full_name || data.username || null,
    phone: data.phone || null,
    avatar: data.avatar || null,
  };
};

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
    const result = await customerService.register(
      username,
      email,
      password,
      "email",
    );

    return res.status(201).json({
      success: true,
      message: "Dang ky thanh cong. Vui long kiem tra email de xac thuc.",
      data: {
        customer: {
          ...toPublicCustomer(result.customer),
          isEmailVerified: false,
        },
        accessToken: result.accessToken,
        needsVerification: true,
      },
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const syncGoogleUser = async (req, res) => {
  try {
    const {
      credential,
      email,
      googleAccessToken,
      idToken,
      providerToken,
      username,
    } = req.body;

    if (!idToken && !credential && !googleAccessToken && !providerToken) {
      return res.status(400).json({
        success: false,
        error: "Thieu Google token",
      });
    }

    const result = await customerService.syncGoogleUser({
      credential,
      email,
      googleAccessToken,
      idToken,
      providerToken,
      username,
    });

    return res.status(200).json({
      success: true,
      message: "Dang nhap Google thanh cong",
      data: {
        customer: toPublicCustomer(result.customer),
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Khong the dong bo voi Google",
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

      return res.status(200).json({
        success: true,
        message: "Dang nhap thanh cong",
        data: {
          customer: toPublicCustomer(result.customer),
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
            message: "Vui long xac thuc email truoc khi dang nhap",
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
    return res.status(error.status || 401).json({
      success: false,
      error: error.message || "Dang nhap that bai",
    });
  }
};
