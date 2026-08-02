import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import env from '../config/env.js';

export const verifyToken = async (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  // Token gửi lên dạng: "Bearer eyJhbGci..."
  const token = tokenHeader && tokenHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ message: "Chưa đăng nhập (Thiếu Token)" });

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await db.User.findByPk(decoded.id, {
      attributes: ["id", "username", "role", "full_name", "is_active"],
    });

    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại hoặc đã bị xóa" });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    };

    return next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};
