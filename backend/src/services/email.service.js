import env from "../config/env.js";
import transporter from "../config/email.js";
import logger from "../config/logger.js";

class EmailService {
  async sendOTPEmail(email, otp, username = "") {
    try {
      const displayName = username || "ban";
      const mailOptions = {
        to: email,
        subject: "[Smart Restaurant] Ma OTP xac thuc",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #d97706; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
                .otp-container { text-align: center; margin: 30px 0; }
                .otp-code { display: inline-block; background-color: #f3f4f6; padding: 20px 40px; border-radius: 10px; border: 2px dashed #d97706; font-family: 'Courier New', monospace; }
                .otp-digits { font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #d97706; }
                .warning { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center; border-left: 4px solid #d97706; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="header"><h1>Smart Restaurant</h1></div>
              <div class="content">
                <h2 style="color: #1f2937; text-align: center;">Xin chao ${displayName}!</h2>
                <p style="color: #4b5563; text-align: center;">Su dung ma OTP ben duoi de xac thuc email.</p>
                <div class="otp-container">
                  <div class="otp-code"><div class="otp-digits">${otp}</div></div>
                </div>
                <div class="warning">
                  <p style="color: #92400e; margin: 0;"><strong>Ma OTP co hieu luc trong 2 phut</strong></p>
                  <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">Khong chia se ma nay voi bat ky ai.</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Neu ban khong yeu cau xac thuc nay, vui long bo qua email.
                </p>
              </div>
              <div class="footer">
                <p>Copyright ${new Date().getFullYear()} Smart Restaurant.</p>
              </div>
            </body>
          </html>
        `,
        text: `Xin chao ${displayName}, ma OTP cua ban la: ${otp}. Ma co hieu luc trong 2 phut.`,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`OTP email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending OTP email:", error.message);

      if (!env.isProduction) {
        logger.warn("Development mode: Email not sent, but continuing.");
        return true;
      }

      throw new Error(`Khong the gui email OTP: ${error.message}`);
    }
  }

  async sendVerificationSuccessEmail(email, username = "") {
    try {
      const displayName = username || "ban";
      const mailOptions = {
        to: email,
        subject: "[Smart Restaurant] Xac thuc email thanh cong",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8" /></head>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h1>Smart Restaurant</h1>
              <p>Xin chao ${displayName},</p>
              <p>Email cua ban da duoc xac thuc thanh cong.</p>
            </body>
          </html>
        `,
        text: `Xin chao ${displayName}, email cua ban da duoc xac thuc thanh cong tai Smart Restaurant.`,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Verification success email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending verification success email:", error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(email, resetToken, username = "") {
    try {
      const displayName = username || "ban";
      const resetUrl = `${env.cors.frontendUrl}/reset-password?token=${resetToken}`;
      const mailOptions = {
        to: email,
        subject: "[Smart Restaurant] Dat lai mat khau",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8" /></head>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h1>Smart Restaurant</h1>
              <p>Xin chao ${displayName},</p>
              <p>Ban co the dat lai mat khau tai lien ket sau:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p>Lien ket het han sau 1 gio.</p>
            </body>
          </html>
        `,
        text: `Xin chao ${displayName}, truy cap link sau de dat lai mat khau: ${resetUrl}. Link het han sau 1 gio.`,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending password reset email:", error.message);
      throw error;
    }
  }
}

export default new EmailService();
