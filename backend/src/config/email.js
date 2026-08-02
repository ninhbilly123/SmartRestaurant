// backend/src/config/email.js
import sgMail from '@sendgrid/mail';
import env from './env.js';
import logger from './logger.js';

// Khởi tạo SendGrid với API key từ .env
if (env.email.sendgridApiKey) {
  sgMail.setApiKey(env.email.sendgridApiKey);
}

// Địa chỉ email gửi đi (dùng từ .env)
const SENDGRID_FROM = env.email.sendgridFrom;

/**
 * Tạo transporter chung cho service gửi email.
 */
const transporter = {
  /**
   * Gửi email sử dụng SendGrid
   * @param {Object} mailOptions - Các tùy chọn email
   * @returns {Promise}
   */
  sendMail: async (mailOptions) => {
    try {
      const msg = {
        to: mailOptions.to,
        from: SENDGRID_FROM,
        subject: mailOptions.subject || 'No Subject',
        text: mailOptions.text || '',
        html: mailOptions.html || mailOptions.text || '',
        ...(mailOptions.attachments && { attachments: mailOptions.attachments })
      };

      logger.info(`Sending email via SendGrid to: ${mailOptions.to}`);
      const response = await sgMail.send(msg);
      
      logger.info(`Email sent successfully. Status: ${response[0].statusCode}`);
      return {
        messageId: response[0].headers['x-message-id'],
        response: response[0]
      };
    } catch (error) {
      logger.error('SendGrid error:', error.message);
      
      // Log chi tiết lỗi nếu có
      if (error.response) {
        logger.error('SendGrid response:', error.response.body);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Kiểm tra kết nối SendGrid.
   * @param {Function} callback - Callback function
   */
  verify: (callback) => {
    // Kiểm tra API key có tồn tại không
    if (!env.email.sendgridApiKey) {
      const error = new Error('SENDGRID_API_KEY is not defined in environment variables');
      logger.error(error.message);
      return callback(error, false);
    }

    // Gửi email test để kiểm tra
    const testMsg = {
      to: SENDGRID_FROM, // Gửi cho chính mình để test
      from: SENDGRID_FROM,
      subject: 'SendGrid Connection Test',
      text: 'This is a test email to verify SendGrid connection.',
      html: '<p>This is a test email to verify SendGrid connection.</p>'
    };

    sgMail.send(testMsg)
      .then(() => {
        logger.info('SendGrid connection verified successfully');
        callback(null, true);
      })
      .catch((error) => {
        logger.error('SendGrid verification failed:', error.message);
        callback(error, false);
      });
  }
};

// Kiểm tra cấu hình
if (!env.email.sendgridApiKey) {
  logger.warn('SENDGRID_API_KEY is missing. Email service may not work.');
} else {
  logger.info('SendGrid API key loaded');
}

if (!SENDGRID_FROM) {
  logger.warn('SENDGRID_FROM is not set. Email sending may fail.');
}

export default transporter;
