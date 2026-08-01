import React from "react";

const ConfirmDialog = ({
	isOpen,
	onClose,
	onConfirm,
	title = "Xác nhận thao tác",
	message = "Bạn có chắc muốn tiếp tục không?",
	confirmText = "Xác nhận",
	cancelText = "Hủy",
	variant = "danger",
}) => {
	if (!isOpen) return null;

	const variantStyles = {
		danger: "bg-red-600 hover:bg-red-700",
		warning: "bg-yellow-600 hover:bg-yellow-700",
		info: "bg-blue-600 hover:bg-blue-700",
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			></div>

			<div className="flex min-h-full items-center justify-center p-4">
				<div
					className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							{title}
						</h3>
						<p className="text-gray-600 mb-6">{message}</p>

						<div className="flex justify-end gap-3">
							<button
								onClick={onClose}
								className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
							>
								{cancelText}
							</button>
							<button
								onClick={() => {
									onConfirm();
									onClose();
								}}
								className={`px-4 py-2 rounded-lg text-white transition-colors ${variantStyles[variant]}`}
							>
								{confirmText}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDialog;
