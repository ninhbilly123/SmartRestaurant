import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import Table from "../models/table.js";
import env from "../config/env.js";

/**
 * QR Code Service
 * Xử lý tạo QR code, token signing, và download
 */
export class QRService {
	/**
	 * Tạo signed token cho table
	 * @param {string} tableId - ID của bàn
	 * @param {string} restaurantId - ID của nhà hàng (optional)
	 * @returns {string} - JWT token
	 */
	static generateToken(tableId, restaurantId = "default-restaurant") {
		const payload = {
			tableId,
			restaurantId,
			timestamp: Date.now(),
			type: "qr_table_access",
		};

		return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.qrExpiresIn });
	}

	/**
	 * Verify token từ QR code
	 * @param {string} token - JWT token cần verify
	 * @returns {object} - Decoded payload
	 */
	static verifyToken(token) {
		try {
			return jwt.verify(token, env.jwt.secret);
		} catch (error) {
			throw new Error("Invalid or expired QR code token");
		}
	}

	/**
	 * Tạo QR code URL cho table
	 * @param {string} tableId - ID của bàn
	 * @param {string} token - Signed token
	 * @returns {string} - URL để encode vào QR code
	 */
	static generateQRUrl(tableId, token) {
		const baseUrl = env.cors.frontendUrl;
		return `${baseUrl}/menu?table=${tableId}&token=${token}`;
	}

	/**
	 * Tạo QR code dạng data URL (base64)
	 * @param {string} url - URL để encode
	 * @param {object} options - QR code options
	 * @returns {Promise<string>} - QR code data URL
	 */
	static async generateQRDataURL(url, options = {}) {
		const defaultOptions = {
			errorCorrectionLevel: "H",
			type: "image/png",
			quality: 0.95,
			margin: 1,
			width: 300,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		};

		return await QRCode.toDataURL(url, { ...defaultOptions, ...options });
	}

	/**
	 * Tạo QR code dạng buffer (cho PNG download)
	 * @param {string} url - URL để encode
	 * @param {object} options - QR code options
	 * @returns {Promise<Buffer>} - QR code buffer
	 */
	static async generateQRBuffer(url, options = {}) {
		const defaultOptions = {
			errorCorrectionLevel: "H",
			type: "png",
			quality: 0.95,
			margin: 2,
			width: 800, // High resolution cho print
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		};

		return await QRCode.toBuffer(url, { ...defaultOptions, ...options });
	}

	/**
	 * Tạo PDF cho một table
	 * @param {object} table - Table object
	 * @param {Buffer} qrBuffer - QR code buffer
	 * @returns {Promise<Buffer>} - PDF buffer
	 */
	static async generatePDF(table, qrBuffer) {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: "A4",
					margin: 50,
				});

				const chunks = [];

				doc.on("data", (chunk) => chunks.push(chunk));
				doc.on("end", () => resolve(Buffer.concat(chunks)));
				doc.on("error", reject);

				// Title
				doc.fontSize(24)
					.font("Helvetica-Bold")
					.text("Smart Restaurant", { align: "center" })
					.moveDown(0.5);

				// Table information
				doc.fontSize(20)
					.font("Helvetica-Bold")
					.text(`Table ${table.table_number}`, { align: "center" })
					.moveDown(0.3);

				doc.fontSize(12)
					.font("Helvetica")
					.text(`Capacity: ${table.capacity} seats`, {
						align: "center",
					});

				if (table.location) {
					doc.text(`Location: ${table.location}`, {
						align: "center",
					});
				}

				doc.moveDown(2);

				// QR Code
				const qrSize = 300;
				const pageWidth = doc.page.width;
				const qrX = (pageWidth - qrSize) / 2;

				doc.image(qrBuffer, qrX, doc.y, {
					width: qrSize,
					height: qrSize,
				});

				doc.moveDown(18);

				// Instructions
				doc.fontSize(16)
					.font("Helvetica-Bold")
					.text("Scan to Order", { align: "center" })
					.moveDown(0.5);

				doc.fontSize(10)
					.font("Helvetica")
					.text("Point your camera at the QR code to view menu", {
						align: "center",
					});

				// Footer
				doc.moveDown(2);
				doc.fontSize(8)
					.fillColor("#666666")
					.text(`Generated on: ${new Date().toLocaleDateString()}`, {
						align: "center",
					})
					.text(`Table ID: ${table.id}`, { align: "center" });

				doc.end();
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Tạo ZIP file chứa tất cả QR codes (PNG)
	 * @param {Array} tables - Array of tables
	 * @returns {Promise<{archive: object, streamPromise: Promise}>}
	 */
	static async generateZIP(tables) {
		const archive = archiver("zip", {
			zlib: { level: 9 }, // Maximum compression
		});

		const streamPromise = new Promise((resolve, reject) => {
			const chunks = [];

			archive.on("data", (chunk) => chunks.push(chunk));
			archive.on("end", () => resolve(Buffer.concat(chunks)));
			archive.on("error", reject);
		});

		// Add each table's QR code to archive
		for (const table of tables) {
			if (table.qr_token) {
				try {
					const url = this.generateQRUrl(table.id, table.qr_token);
					const qrBuffer = await this.generateQRBuffer(url);

					archive.append(qrBuffer, {
						name: `table_${table.table_number}_qr.png`,
					});
				} catch (error) {
					console.error(
						`Error generating QR for table ${table.table_number}:`,
						error
					);
				}
			}
		}

		archive.finalize();

		return { archive, streamPromise };
	}

	/**
	 * Tạo PDF chứa tất cả QR codes (multiple tables)
	 * @param {Array} tables - Array of tables
	 * @returns {Promise<Buffer>} - PDF buffer
	 */
	static async generateBulkPDF(tables) {
		const doc = new PDFDocument({
			size: "A4",
			margin: 50,
		});

		const chunks = [];

		doc.on("data", (chunk) => chunks.push(chunk));
		doc.on("error", (err) => {
			console.error("PDF generation error:", err);
		});

		const pdfPromise = new Promise((resolve, reject) => {
			doc.on("end", () => resolve(Buffer.concat(chunks)));
			doc.on("error", reject);
		});

		// Generate all QR codes first
		const qrBuffers = await Promise.all(
			tables.map(async (table) => {
				if (!table.qr_token) return null;
				try {
					const url = this.generateQRUrl(table.id, table.qr_token);
					const qrBuffer = await this.generateQRBuffer(url);
					return { table, qrBuffer };
				} catch (error) {
					console.error(
						`Error generating QR for table ${table.table_number}:`,
						error
					);
					return null;
				}
			})
		);

		// Filter out null results and add to PDF
		const validQRs = qrBuffers.filter((item) => item !== null);

		for (let i = 0; i < validQRs.length; i++) {
			const { table, qrBuffer } = validQRs[i];

			// Add new page for each table (except first)
			if (i > 0) {
				doc.addPage();
			}

			// Title
			doc.fontSize(24)
				.font("Helvetica-Bold")
				.fillColor("#000000")
				.text("Smart Restaurant", { align: "center" })
				.moveDown(0.5);

			// Table information
			doc.fontSize(20)
				.font("Helvetica-Bold")
				.text(`Table ${table.table_number}`, { align: "center" })
				.moveDown(0.3);

			doc.fontSize(12)
				.font("Helvetica")
				.text(`Capacity: ${table.capacity} seats`, { align: "center" });

			if (table.location) {
				doc.text(`Location: ${table.location}`, { align: "center" });
			}

			doc.moveDown(2);

			// Add QR code image
			const qrSize = 300;
			const pageWidth = doc.page.width;
			const qrX = (pageWidth - qrSize) / 2;

			doc.image(qrBuffer, qrX, doc.y, {
				width: qrSize,
				height: qrSize,
			});

			doc.moveDown(18);

			// Instructions
			doc.fontSize(16)
				.font("Helvetica-Bold")
				.text("Scan to Order", { align: "center" })
				.moveDown(0.5);

			doc.fontSize(10)
				.font("Helvetica")
				.text("Point your camera at the QR code to view menu", {
					align: "center",
				});

			// Footer
			doc.moveDown(2);
			doc.fontSize(8)
				.fillColor("#666666")
				.text(`Generated on: ${new Date().toLocaleDateString()}`, {
					align: "center",
				})
				.text(`Table ID: ${table.id}`, { align: "center" });
		}

		doc.end();

		return pdfPromise;
	}

	/**
	 * Invalidate old token và generate new one
	 * @param {object} table - Table object
	 * @returns {Promise<object>} - Updated table with new token
	 */
	static async regenerateToken(table) {
		const newToken = this.generateToken(table.id);

		await table.update({
			qr_token: newToken,
			qr_token_created_at: new Date(),
		});

		return table;
	}
}

export default QRService;
