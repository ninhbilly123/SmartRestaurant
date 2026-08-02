// backend/src/config/email.js
import nodemailer from "nodemailer";
import env from "./env.js";
import logger from "./logger.js";

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: {
    user: env.email.user,
    pass: env.email.password,
  },
});

const originalSendMail = transporter.sendMail.bind(transporter);

transporter.sendMail = async (mailOptions) => {
  if (!env.email.user || !env.email.password) {
    throw new Error("EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình");
  }

  const message = {
    ...mailOptions,
    from: mailOptions.from || env.email.from || env.email.user,
  };

  logger.info(`Sending email via Nodemailer to: ${message.to}`);
  const info = await originalSendMail(message);
  logger.info(`Email sent successfully: ${info.messageId}`);
  return info;
};

if (!env.email.user || !env.email.password) {
  logger.warn("EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình. Email service may not work.");
} else {
  logger.info("Nodemailer SMTP credentials loaded");
}

export default transporter;
