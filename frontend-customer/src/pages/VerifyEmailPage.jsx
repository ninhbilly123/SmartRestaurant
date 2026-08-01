import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";

const VerifyEmailPage = () => {
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [timer, setTimer] = useState(120); // 15 phút
	const [canResend, setCanResend] = useState(false);
	
	const navigate = useNavigate();
	const location = useLocation();
	const inputRefs = useRef([]);

	// Lấy thông tin từ state
	const customerId = location.state?.customerId || location.state?.customerUid;
	const email = location.state?.email;
	const username = location.state?.username;
	const from = location.state?.from || "/";
	const message = location.state?.message;


	// Hiển thị message và kiểm tra thông tin
	useEffect(() => {
		if (message) {
			setSuccess(message);
		}
		
		if (!customerId || !email) {
			setError("Thông tin xác thực không đầy đủ. Vui lòng thử lại.");
		}
	}, [customerId, email, message]);

	// Timer countdown
	useEffect(() => {
		if (timer > 0) {
			const interval = setInterval(() => {
				setTimer(prev => prev - 1);
			}, 1000);
			return () => clearInterval(interval);
		} else {
			setCanResend(true);
		}
	}, [timer]);

	// Format timer
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Handle OTP input change
	const handleOtpChange = (index, value) => {
		if (value.length > 1) {
			// Handle paste
			const pastedValues = value.slice(0, 6).split("");
			const newOtp = [...otp];
			pastedValues.forEach((val, idx) => {
				if (idx < 6 && /^[0-9]$/.test(val)) {
					newOtp[idx] = val;
				}
			});
			setOtp(newOtp);
			
			const lastIndex = Math.min(5, pastedValues.length - 1);
			if (inputRefs.current[lastIndex]) {
				inputRefs.current[lastIndex].focus();
			}
			return;
		}

		// Chỉ cho phép nhập số
		if (value && !/^[0-9]$/.test(value)) {
			return;
		}

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		// Tự động focus sang ô tiếp theo
		if (value && index < 5) {
			inputRefs.current[index + 1].focus();
		}

		// Tự động verify khi nhập đủ 6 số
		if (newOtp.every(digit => digit !== "") && index === 5) {
			handleVerify();
		}
	};

	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace") {
			if (!otp[index] && index > 0) {
				// Xóa ô trước
				const newOtp = [...otp];
				newOtp[index - 1] = "";
				setOtp(newOtp);
				inputRefs.current[index - 1].focus();
			} else if (otp[index]) {
				// Xóa ô hiện tại
				const newOtp = [...otp];
				newOtp[index] = "";
				setOtp(newOtp);
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			inputRefs.current[index - 1].focus();
		} else if (e.key === "ArrowRight" && index < 5) {
			inputRefs.current[index + 1].focus();
		}
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text");
		const numbers = pastedData.replace(/\D/g, "").slice(0, 6).split("");
		
		const newOtp = [...otp];
		numbers.forEach((num, idx) => {
			if (idx < 6) {
				newOtp[idx] = num;
			}
		});
		setOtp(newOtp);
		
		const lastIndex = Math.min(5, numbers.length - 1);
		if (inputRefs.current[lastIndex]) {
			inputRefs.current[lastIndex].focus();
		}
	};

	const handleVerify = async () => {
		if (!customerId || !email) {
			setError("Không có thông tin xác thực. Vui lòng thử lại.");
			return;
		}

		const otpString = otp.join("");
		
		if (otpString.length !== 6) {
			return;
		}

		if (!/^\d{6}$/.test(otpString)) {
			setError("OTP chỉ được chứa số từ 0-9");
			return;
		}

		setLoading(true);
		setError("");
		setSuccess("");

		try {
	
			const response = await customerService.verifyEmailOTP(customerId, email, otpString);
			
			if (response.success) {
				setSuccess("✅ Xác thực email thành công!");
				
				// Redirect về trang login
				setTimeout(() => {
					navigate("/customer/login", {
						state: {
							registeredEmail: email,
							registeredUsername: username,
							from: from,
							message: "Email đã được xác thực thành công!"
						},
						replace: true
					});
				});
			} else {
				const errorMsg = response.error || response.message || "Xác thực thất bại";
				throw new Error(errorMsg);
			}

		} catch (err) {
			
			let displayError = err.message || "Xác thực thất bại. Vui lòng thử lại.";
			
			// Xử lý lỗi cụ thể
			if (err.message.includes("Network Error") || err.message.includes("timeout")) {
				displayError = "Không thể kết nối đến server. Vui lòng kiểm tra internet và thử lại.";
			}
			
			setError(`❌ ${displayError}`);
			
			// Reset OTP và focus vào ô đầu tiên
			setOtp(["", "", "", "", "", ""]);
			if (inputRefs.current[0]) {
				inputRefs.current[0].focus();
			}
		} finally {
			setLoading(false);
		}
	};

	const handleResendOTP = async () => {
		if (!canResend || !customerId || !email) return;

		setLoading(true);
		setError("");
		setSuccess("");

		try {
			
			const response = await customerService.resendOTP(customerId, email);
			
			if (response.success) {
				setSuccess("Vui lòng kiểm tra email mã OTP của bạn");
				setTimer(120); 
				setCanResend(false);
				setOtp(["", "", "", "", "", ""]);
				
				// Focus vào ô đầu tiên
				if (inputRefs.current[0]) {
					inputRefs.current[0].focus();
				}
			} else {
				const errorMsg = response.error || response.message || "Không thể gửi lại OTP";
				throw new Error(errorMsg);
			}

		} catch (err) {
			setError(err.message || "Không thể gửi lại OTP. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
						<span className="text-white text-2xl font-bold">R</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Smart Restaurant</h1>
					<h2 className="text-xl font-semibold mt-2 text-gray-700">Xác thực Email</h2>
					<p className="text-gray-600 mt-2">
						Nhập mã OTP 6 số đã được gửi đến
						<br />
						<strong className="text-amber-600">{email || "Email của bạn"}</strong>
					</p>
					{username && (
						<p className="text-gray-500 text-sm mt-1">
							Tài khoản: <span className="font-medium">{username}</span>
						</p>
					)}
					{!customerId && (
						<p className="text-red-500 text-sm mt-2">
							⚠️ Thiếu thông tin xác thực
						</p>
					)}
				</div>
				
				{error && (
					<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
						{error}
					</div>
				)}
				{success && (
					<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
						{success}
					</div>
				)}
				
				<div className="space-y-6">
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-4 text-center">
							Mã OTP (6 số)
						</label>
						<div className="flex justify-center gap-3 mb-6">
							{[0, 1, 2, 3, 4, 5].map((index) => (
								<input
									key={index}
									ref={(el) => (inputRefs.current[index] = el)}
									type="text"
									inputMode="numeric"
									maxLength="1"
									value={otp[index]}
									onChange={(e) => handleOtpChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									onPaste={handlePaste}
									className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
									disabled={loading || !customerId}
									autoFocus={index === 0}
								/>
							))}
						</div>
						
						<div className="text-center mb-6">
							<p className="text-gray-600 mb-2">
								Thời gian còn lại:{" "}
								<span className={`font-bold ${timer < 60 ? "text-red-600" : "text-amber-600"}`}>
									{formatTime(timer)}
								</span>
							</p>
							
							<button
								type="button"
								onClick={handleResendOTP}
								disabled={!canResend || loading || !customerId}
								className={`text-sm ${canResend ? "text-amber-600 hover:text-amber-700 font-semibold" : "text-gray-400 cursor-not-allowed"}`}
							>
								{canResend ? "Gửi lại mã OTP" : "Gửi lại mã sau"}
							</button>
						</div>
					</div>

					<button
						onClick={handleVerify}
						disabled={loading || otp.some(digit => digit === "") || !customerId}
						className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
							loading || otp.some(digit => digit === "") || !customerId
								? "bg-gray-400 cursor-not-allowed"
								: "bg-amber-600 hover:bg-amber-700"
						}`}
					>
						{loading ? "Đang xác thực..." : "Xác thực Email"}
					</button>

					<div className="text-center pt-4 border-t border-gray-200">
						<p className="text-gray-600 text-sm mb-2">
							Mã không đến? Kiểm tra thư mục spam hoặc{" "}
							<button
								onClick={handleResendOTP}
								disabled={!canResend || loading || !customerId}
								className={`${canResend && !loading && customerId ? "text-amber-600 hover:text-amber-700 font-medium" : "text-gray-400 cursor-not-allowed"}`}
							>
								gửi lại
							</button>
						</p>
						<button
							onClick={() => navigate("/customer/login", { state: { from } })}
							className="mt-4 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
							disabled={loading}
						>
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Quay lại đăng nhập
						</button>
						<button
							onClick={() => navigate("/customer/register", { state: { from } })}
							className="mt-2 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
							disabled={loading}
						>
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							Quay lại đăng ký
						</button>
					</div>

					{/* Debug info (chỉ hiển thị trong development) */}
					{import.meta.env.DEV && (
						<div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
							<details className="cursor-pointer">
								<summary className="font-bold text-sm text-gray-700">Debug Info</summary>
								<div className="mt-2 text-xs">
									<pre className="whitespace-pre-wrap break-words">
										{JSON.stringify({
											customerId: customerId ? `${customerId.substring(0, 8)}...` : "MISSING",
											email: email || "MISSING",
											username: username || "MISSING",
											otp: otp.join(""),
											otpLength: otp.join("").length,
											timer: timer,
											canResend: canResend,
											from: from
										}, null, 2)}
									</pre>
									
									<div className="mt-3 space-x-2">
										<button 
											onClick={() => {
												// Test với OTP giả
												setOtp(["1", "2", "3", "4", "5", "6"]);
											}}
											className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
										>
											Fill Test OTP: 123456
										</button>
										
										<button 
											onClick={() => {
												console.log("📊 STATE DUMP:", {
													customerId,
													email,
													username,
													otp,
													locationState: location.state
												});
											}}
											className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
										>
											Log State to Console
										</button>
									</div>
								</div>
							</details>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default VerifyEmailPage;
