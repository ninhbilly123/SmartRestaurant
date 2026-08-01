import bcrypt from "bcryptjs";
import db from "../src/models/index.js";

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "123456";
const fullName = process.env.ADMIN_FULL_NAME || "Smart Restaurant Admin";

try {
  await db.sequelize.sync({ alter: true });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user, created] = await db.User.findOrCreate({
    where: { username },
    defaults: {
      username,
      password: passwordHash,
      role: "super_admin",
      full_name: fullName,
      is_active: true,
    },
  });

  if (!created && !user.is_active) {
    user.is_active = true;
    await user.save();
  }

  console.log(
    created
      ? `Seeded super admin account: ${username}`
      : `Super admin account already exists: ${username}`,
  );
} catch (error) {
  console.error("Failed to seed admin account:", error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
