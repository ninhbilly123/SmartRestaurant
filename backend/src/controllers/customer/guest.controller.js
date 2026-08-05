import * as guestService from "../../services/guest.service.js";
import logger from "../../config/logger.js";

const getGuestMenu = async (req, res) => {
	try {
		const {
			q,
			categoryId,
			sort,
			chefRecommended,
			page = 1,
			limit = 10,
		} = req.query;

		const result = await guestService.getGuestMenu({
			tableId: req.tableId,
			search: q,
			categoryId,
			sort,
			chefRecommended: chefRecommended === "true",
			page: parseInt(page),
			limit: parseInt(limit),
		});

		return res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		logger.error("Error fetching guest menu:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export { getGuestMenu };
