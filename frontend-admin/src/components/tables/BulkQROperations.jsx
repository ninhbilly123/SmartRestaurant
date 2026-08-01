import { useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Alert from "../common/Alert";
import ConfirmDialog from "../common/ConfirmDialog";
import tableService from "../../services/tableService";

const BulkQROperations = ({ onUpdate }) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);

	const handleBulkRegenerate = async () => {
		try {
			setLoading(true);
			setError("");
			setShowConfirmRegenerate(false);
			const result = await tableService.bulkRegenerateQR();
			setSuccess(
				`Đã tạo lại ${result.data.stats.successful} mã QR. Tất cả mã QR cũ không còn hiệu lực.`
			);
			if (onUpdate) onUpdate();
			setTimeout(() => setSuccess(""), 5000);
		} catch (err) {
			setError(
				err.response?.data?.message || "Không thể tạo lại mã QR"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadAll = async (format) => {
		try {
			setLoading(true);
			setError("");
			const blob = await tableService.downloadAllQR(format);

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			const extension = format === "zip" ? "zip" : "pdf";
			link.download = `all-qr-codes.${extension}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			setSuccess(`Đã tải tất cả mã QR dạng ${format.toUpperCase()}`);
			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			setError(
				err.response?.data?.message || "Không thể tải mã QR"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<div className="p-6">
				<h3 className="text-lg font-semibold mb-4">
					Thao tác QR hàng loạt
				</h3>

				{error && (
					<Alert
						type="error"
						message={error}
						onClose={() => setError("")}
						className="mb-4"
					/>
				)}
				{success && (
					<Alert
						type="success"
						message={success}
						onClose={() => setSuccess("")}
						className="mb-4"
					/>
				)}

				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Tải tất cả mã QR
						</h4>
						<div className="flex gap-2 flex-wrap">
							<Button
								variant="primary"
								onClick={() => handleDownloadAll("zip")}
								disabled={loading}
							>
								{loading ? "Đang tải..." : "Tải dạng ZIP"}
							</Button>
							<Button
								variant="secondary"
								onClick={() => handleDownloadAll("pdf")}
								disabled={loading}
							>
								{loading ? "Đang tải..." : "Tải dạng PDF"}
							</Button>
						</div>
						<p className="text-xs text-gray-500 mt-2">
							File ZIP chứa từng ảnh PNG riêng. File PDF chứa tất cả mã QR trong một tài liệu.
						</p>
					</div>

					<div className="border-t pt-4">
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Tạo lại tất cả mã QR
						</h4>
						<Button
							variant="danger"
							onClick={() => setShowConfirmRegenerate(true)}
							disabled={loading}
						>
							Tạo lại tất cả mã QR
						</Button>
						<p className="text-xs text-red-600 mt-2">
							⚠️ Thao tác này sẽ làm TẤT CẢ mã QR hiện tại không còn hiệu lực.
							Các bản in trước đó sẽ không dùng được.
						</p>
					</div>
				</div>

				{/* Confirm Regenerate Dialog */}
				<ConfirmDialog
					isOpen={showConfirmRegenerate}
					onClose={() => setShowConfirmRegenerate(false)}
					onConfirm={handleBulkRegenerate}
					title="Tạo lại tất cả mã QR"
					message="Bạn có chắc muốn tạo lại toàn bộ mã QR không? Tất cả mã QR hiện tại và các bản đã in sẽ không còn hoạt động. Thao tác này không thể hoàn tác."
					confirmText="Tạo lại tất cả"
					variant="danger"
				/>
			</div>
		</Card>
	);
};

export default BulkQROperations;
