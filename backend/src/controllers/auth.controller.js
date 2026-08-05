import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import env from "../config/env.js";
import db from "../models/index.js";

const User = db.User;
const STAFF_ROLES = ["waiter", "kitchen"];
const ADMIN_ROLES = ["admin", "super_admin"];
const USER_ROLES = ["super_admin", "admin", ...STAFF_ROLES];

const toPublicUser = (user) => {
  const data = user?.toJSON ? user.toJSON() : user;
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    role: data.role,
    fullName: data.full_name,
    full_name: data.full_name,
    is_active: data.is_active,
    created_at: data.created_at,
  };
};

const canManageUser = (currentUser, targetUser) => {
  if (String(currentUser.id) === String(targetUser.id)) return true;
  if (currentUser.role === "super_admin" && targetUser.role === "admin") return true;
  return currentUser.role === "admin" && STAFF_ROLES.includes(targetUser.role);
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "Tai khoan khong ton tai" });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: "Tai khoan da bi vo hieu hoa" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Sai mat khau" });
    }

    const publicUser = toPublicUser(user);
    const token = jwt.sign(
      {
        id: publicUser.id,
        username: publicUser.username,
        role: publicUser.role,
        fullName: publicUser.fullName,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn },
    );

    return res.status(200).json({
      message: "Dang nhap thanh cong",
      token,
      user: publicUser,
    });
  } catch {
    return res.status(500).json({ message: "Loi server" });
  }
};

export const createUser = async (req, res) => {
  try {
    const creatorRole = req.user?.role;
    const { username, password, role, full_name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc" });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ message: "Vai tro khong hop le" });
    }

    if (!ADMIN_ROLES.includes(creatorRole)) {
      return res.status(403).json({ message: "Khong co quyen tao tai khoan" });
    }

    if (creatorRole === "admin" && !STAFF_ROLES.includes(role)) {
      return res.status(403).json({
        message: "Admin chi duoc tao tai khoan waiter hoac kitchen",
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      full_name,
      is_active: true,
    });

    return res.status(201).json({
      message: "Tao tai khoan thanh cong",
      user: toPublicUser(newUser),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    let whereCondition;

    if (currentUser.role === "super_admin") {
      whereCondition = { role: "admin" };
    } else if (currentUser.role === "admin") {
      whereCondition = { role: { [Op.or]: STAFF_ROLES } };
    } else {
      return res.status(403).json({ message: "Khong co quyen xem danh sach nay" });
    }

    const users = await User.findAll({
      where: whereCondition,
      attributes: ["id", "username", "full_name", "role", "is_active", "created_at"],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(users.map(toPublicUser));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, password } = req.body;
    const currentUser = req.user;

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageUser(currentUser, userToUpdate)) {
      return res.status(403).json({ message: "Khong co quyen sua user nay" });
    }

    if (full_name !== undefined) userToUpdate.full_name = full_name;
    if (password && password.trim() !== "") {
      userToUpdate.password = await bcrypt.hash(password, 10);
    }

    await userToUpdate.save();

    return res.status(200).json({
      message: "Cap nhat thanh cong",
      user: toPublicUser(userToUpdate),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const currentUser = req.user;

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    const canToggle =
      (currentUser.role === "super_admin" && userToUpdate.role === "admin") ||
      (currentUser.role === "admin" && STAFF_ROLES.includes(userToUpdate.role));

    if (!canToggle) {
      return res.status(403).json({
        message: "Khong co quyen thay doi trang thai user nay",
      });
    }

    userToUpdate.is_active = Boolean(is_active);
    await userToUpdate.save();

    return res.status(200).json({
      message: `Tai khoan da duoc ${userToUpdate.is_active ? "mo khoa" : "khoa"}`,
      user: toPublicUser(userToUpdate),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
