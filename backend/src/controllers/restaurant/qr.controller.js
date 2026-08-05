import Table from "../../models/table.js";
import { TableService } from "../../services/table.service.js";
import QRService from "../../services/qr.service.js";
import { Op } from "sequelize";
import logger from "../../config/logger.js";

/**
 * Generate QR code cho một table
 * POST /api/admin/tables/:id/qr/generate
 */
export const generateQRCode = async (req, res) => {
	try {
		const { id } = req.params;

		// Generate hoặc regenerate QR code
		const table = await TableService.generateQR(id);

		// Get QR code data URL cho preview
		const qrUrl = QRService.generateQRUrl(table.id, table.qr_token);
		const qrDataURL = await QRService.generateQRDataURL(qrUrl);

		res.json({
			success: true,
			message: "QR code generated successfully",
			data: {
				table: {
					id: table.id,
					table_number: table.table_number,
					qr_token: table.qr_token,
					qr_token_created_at: table.qr_token_created_at,
				},
				qr_url: qrUrl,
				qr_data_url: qrDataURL,
			},
		});
	} catch (error) {
		logger.error("Error generating QR code:", error);

		if (error.message === "Table not found") {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}

		res.status(500).json({
			success: false,
			message: "Failed to generate QR code",
			error: error.message,
		});
	}
};

/**
 * Regenerate QR code cho một table (invalidate old token)
 * POST /api/admin/tables/:id/qr/regenerate
 */
export const regenerateQRCode = async (req, res) => {
	try {
		const { id } = req.params;

		const table = await TableService.regenerateQR(id);

		// Get QR code data URL
		const qrUrl = QRService.generateQRUrl(table.id, table.qr_token);
		const qrDataURL = await QRService.generateQRDataURL(qrUrl);

		res.json({
			success: true,
			message:
				"QR code regenerated successfully. Old QR code is now invalid.",
			data: {
				table: {
					id: table.id,
					table_number: table.table_number,
					qr_token: table.qr_token,
					qr_token_created_at: table.qr_token_created_at,
				},
				qr_url: qrUrl,
				qr_data_url: qrDataURL,
			},
		});
	} catch (error) {
		logger.error("Error regenerating QR code:", error);

		if (error.message === "Table not found") {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}

		res.status(500).json({
			success: false,
			message: "Failed to regenerate QR code",
			error: error.message,
		});
	}
};

/**
 * Bulk regenerate QR codes
 * POST /api/admin/tables/qr/regenerate-all
 */
export const bulkRegenerateQRCodes = async (req, res) => {
	try {
		const { table_ids } = req.body; // Optional: array of table IDs

		const results = await TableService.bulkRegenerateQR(table_ids);

		res.json({
			success: true,
			message: `Bulk QR regeneration completed. ${results.success} succeeded, ${results.failed} failed.`,
			data: results,
		});
	} catch (error) {
		logger.error("Error bulk regenerating QR codes:", error);
		res.status(500).json({
			success: false,
			message: "Failed to bulk regenerate QR codes",
			error: error.message,
		});
	}
};

/**
 * Download QR code as PNG
 * GET /api/admin/tables/:id/qr/download?format=png
 */
export const downloadQRCode = async (req, res) => {
	try {
		const { id } = req.params;
		const { format } = req.query; // 'png' or 'pdf'

		const table = await Table.findByPk(id);

		if (!table) {
			return res.status(404).json({
				success: false,
				message: "Table not found",
			});
		}

		if (!table.qr_token) {
			return res.status(400).json({
				success: false,
				message: "Table does not have a QR code. Generate one first.",
			});
		}

		const qrUrl = QRService.generateQRUrl(table.id, table.qr_token);

		if (format === "pdf") {
			// Generate PDF
			const qrBuffer = await QRService.generateQRBuffer(qrUrl);
			const pdfBuffer = await QRService.generatePDF(table, qrBuffer);

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="table_${table.table_number}_qr.pdf"`
			);
			res.send(pdfBuffer);
		} else {
			// Default: PNG
			const qrBuffer = await QRService.generateQRBuffer(qrUrl);

			res.setHeader("Content-Type", "image/png");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="table_${table.table_number}_qr.png"`
			);
			res.send(qrBuffer);
		}
	} catch (error) {
		logger.error("Error downloading QR code:", error);
		res.status(500).json({
			success: false,
			message: "Failed to download QR code",
			error: error.message,
		});
	}
};

/**
 * Download all QR codes as ZIP
 * GET /api/admin/tables/qr/download-all?format=zip
 */
export const downloadAllQRCodes = async (req, res) => {
	try {
		const { format } = req.query; // 'zip' or 'pdf'

		// Get all tables with QR tokens
		const tables = await Table.findAll({
			where: {
				qr_token: { [Op.ne]: null },
			},
		});

		if (tables.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No tables with QR codes found",
			});
		}

		if (format === "pdf") {
			// Generate bulk PDF
			const pdfBuffer = await QRService.generateBulkPDF(tables);

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				'attachment; filename="all_tables_qr.pdf"'
			);
			res.send(pdfBuffer);
		} else {
			// Default: ZIP
			const { streamPromise } = await QRService.generateZIP(tables);
			const zipBuffer = await streamPromise;

			res.setHeader("Content-Type", "application/zip");
			res.setHeader(
				"Content-Disposition",
				'attachment; filename="all_tables_qr.zip"'
			);
			res.send(zipBuffer);
		}
	} catch (error) {
		logger.error("Error downloading all QR codes:", error);
		res.status(500).json({
			success: false,
			message: "Failed to download QR codes",
			error: error.message,
		});
	}
};

/**
 * Verify QR token (for customer menu access)
 * GET /api/menu?table=:tableId&token=:token
 */
export const verifyQRToken = async (req, res) => {
	try {
		const { table: tableId, token } = req.query;

		if (!tableId || !token) {
			return res.status(400).json({
				success: false,
				message: "Missing table ID or token",
			});
		}

		// Verify token
		let decoded;
		try {
			decoded = QRService.verifyToken(token);
		} catch (error) {
			return res.status(401).json({
				success: false,
				message:
					"This QR code is no longer valid. Please ask staff for assistance.",
				error: "Invalid or expired token",
			});
		}

		// Check if token matches table
		if (decoded.tableId !== tableId) {
			return res.status(401).json({
				success: false,
				message: "Invalid QR code",
				error: "Token does not match table",
			});
		}

		// Get table information
		const table = await Table.findByPk(tableId);

		if (!table) {
			return res.status(404).json({
				success: false,
				message: "Table not found",
			});
		}

		// Check if table is active
		if (table.status !== "active") {
			return res.status(403).json({
				success: false,
				message:
					"This table is currently inactive. Please ask staff for assistance.",
			});
		}

		// Check if current token matches
		if (table.qr_token !== token) {
			// Log security event
			logger.warn(
				`[SECURITY] Old/invalid QR token used for table ${table.table_number}`
			);

			return res.status(401).json({
				success: false,
				message:
					"This QR code is no longer valid. Please ask staff for assistance.",
				error: "Token has been regenerated",
			});
		}

		// Success - return table info and allow menu access
		res.json({
			success: true,
			message: "QR code verified successfully",
			data: {
				table: {
					id: table.id,
					table_number: table.table_number,
					capacity: table.capacity,
					location: table.location,
				},
				token_info: {
					created_at: table.qr_token_created_at,
				},
			},
		});
	} catch (error) {
		logger.error("Error verifying QR token:", error);
		res.status(500).json({
			success: false,
			message: "Failed to verify QR code",
			error: error.message,
		});
	}
};

/**
 * Get QR code preview (data URL)
 * GET /api/admin/tables/:id/qr/preview
 */
export const getQRPreview = async (req, res) => {
	try {
		const { id } = req.params;

		const table = await Table.findByPk(id);

		if (!table) {
			return res.status(404).json({
				success: false,
				message: "Table not found",
			});
		}

		if (!table.qr_token) {
			return res.status(400).json({
				success: false,
				message: "Table does not have a QR code. Generate one first.",
			});
		}

		const qrUrl = QRService.generateQRUrl(table.id, table.qr_token);
		const qrDataURL = await QRService.generateQRDataURL(qrUrl);

		res.json({
			success: true,
			data: {
				table: {
					id: table.id,
					table_number: table.table_number,
					qr_token_created_at: table.qr_token_created_at,
				},
				qr_url: qrUrl,
				qr_data_url: qrDataURL,
			},
		});
	} catch (error) {
		logger.error("Error getting QR preview:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get QR preview",
			error: error.message,
		});
	}
};
