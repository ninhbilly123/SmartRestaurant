import QRService from "../services/qr.service.js";
import Table from "../models/table.js";
import logger from "../config/logger.js";

export default async (req, res, next) => {
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

		// Success - allow menu access
		req.tableId = decoded.tableId;
		next();
	} catch (error) {
		logger.error("Error verifying QR token:", error);
		res.status(500).json({
			success: false,
			message: "Failed to verify QR code",
			error: error.message,
		});
	}
};
