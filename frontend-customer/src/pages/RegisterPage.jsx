import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";
import { debounce } from "lodash"; 

const validateEmail = (email) => {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
};

const RegisterPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: ""
	});
	const [errors, setErrors] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
		general: ""
	});
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [emailChecking, setEmailChecking] = useState(false);
	const [emailAvailable, setEmailAvailable] = useState(null); 
	const navigate = useNavigate();
	const location = useLocation();

	// Lấy URL menu gốc đã được truyền từ Login 
	const from = location.state?.from || "/";

	// Debounce function để kiểm tra email
	const checkEmailDebounced = useMemo(
		() => debounce(async (email) => {
			if (!email || email.length < 3 || !validateEmail(email)) {
				setEmailAvailable(null);
				return;
			}

			setEmailChecking(true);
			try {
				const result = await customerService.checkEmailExists(email);
				
				if (result.success) {
					if (result.data?.exists === false) {
						setEmailAvailable(true);
						setErrors(prev => ({ ...prev, email: "" }));
					} else {
						setEmailAvailable(false);
						setErrors(prev => ({ ...prev, email: "Email này đã được sử dụng" }));
					}
				} else {
					setEmailAvailable(null);
					console.error("Email check failed:", result.error);
				}
			} catch (error) {
				console.error("Email check error:", error);
				setEmailAvailable(null);
			} finally {
				setEmailChecking(false);
			}
		}, 500),
		[]
	);

	// Validate form
	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.username.trim()) {
			newErrors.username = "Vui lòng nhập họ tên";
		} else if (formData.username.length < 2) {
			newErrors.username = "Họ tên phải có ít nhất 2 ký tự";
		}

		if (!formData.email) {
			newErrors.email = "Vui lòng nhập email";
		} else if (!validateEmail(formData.email)) {
			newErrors.email = "Email không hợp lệ";
		} else if (emailAvailable === false) {
			newErrors.email = "Email này đã được sử dụng";
		}

		if (!formData.password) {
			newErrors.password = "Vui lòng nhập mật khẩu";
		} else if (formData.password.length < 6) {
			newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
		}

		setErrors(prev => ({ ...prev, ...newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	// Xử lý thay đổi email
	useEffect(() => {
		if (formData.email && validateEmail(formData.email)) {
			checkEmailDebounced(formData.email);
		} else {
			setEmailAvailable(null);
			setErrors(prev => ({ ...prev, email: "" }));
		}

		// Cleanup
		return () => {
			checkEmailDebounced.cancel();
		};
	}, [formData.email, checkEmailDebounced]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		
		// Clear error khi người dùng bắt đầu nhập
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: "", general: "" }));
		}

		// Nếu là email và đang báo lỗi "đã sử dụng", reset trạng thái
		if (name === "email" && emailAvailable === false) {
			setEmailAvailable(null);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });
		setSuccess("");
		setLoading(true);

		// Validate form
		if (!validateForm()) {
			setLoading(false);
			return;
		}

		// Kiểm tra email một lần nữa trước khi submit
		if (emailAvailable === false) {
			setErrors(prev => ({ ...prev, general: "Email này đã được sử dụng" }));
			setLoading(false);
			return;
		}

		try {
			const response = await customerService.register(
				formData.username, 
				formData.email, 
				formData.password
			);

			if (response.success) {
				const customerId = response.data?.customer?.uid || 
								  response.data?.customerId ||
								  response.customerId;

				if (!customerId) {
					throw new Error("Không nhận được thông tin xác thực từ server");
				}
				
				setSuccess("Đăng ký thành công! Vui lòng nhập mã OTP xác thực.");
				
				setTimeout(() => {
					navigate("/customer/verify-email", { 
						state: { 
							customerId: customerId,
							email: formData.email,
							username: formData.username,
							from: from, 
							message: "Đăng ký thành công! Vui lòng xác thực email." 
						}
					});
				});

			} else {
				// Xử lý lỗi từ server
				if (response.error?.includes("email") || response.error?.includes("Email")) {
					setErrors(prev => ({ ...prev, email: "Email này đã được sử dụng" }));
					setEmailAvailable(false);
				} else {
					setErrors(prev => ({ ...prev, general: response.error || "Đăng ký thất bại" }));
				}
			}

		} catch (err) {
			console.error("Register error:", err);
			setErrors(prev => ({ ...prev, general: err.message || "Đăng ký thất bại" }));
		} finally {
			setLoading(false);
		}
	};

	// Hàm render trạng thái email
	const renderEmailStatus = () => {
		if (!formData.email || !validateEmail(formData.email)) return null;
		
		if (emailChecking) {
			return (
				<div className="flex items-center mt-1 text-blue-600 text-sm">
					<svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Đang kiểm tra email...
				</div>
			);
		}

		if (emailAvailable === true) {
			return (
				<div className="flex items-center mt-1 text-green-600 text-sm">
					<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
					Email có thể sử dụng
				</div>
			);
		}

		if (emailAvailable === false) {
			return (
				<div className="flex items-center mt-1 text-red-600 text-sm">
					<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
					</svg>
					Email đã được sử dụng
				</div>
			);
		}

		return null;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
						<span className="text-white text-2xl font-bold">R</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Smart Restaurant</h1>
					<h2 className="text-xl font-semibold mt-2 text-gray-700">Đăng Ký Khách Hàng</h2>
					<p className="text-gray-600 mt-2 text-sm">
						Đăng ký để lưu đơn hàng và nhận ưu đãi
					</p>
				</div>
				
				{errors.general && (
					<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
						{errors.general}
					</div>
				)}
				{success && (
					<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
						{success}
					</div>
				)}
				
				<form onSubmit={handleSubmit} className="space-y-6" noValidate>
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">
							Họ tên khách hàng
						</label>
						<input 
							name="username" 
							type="text" 
							value={formData.username}
							onChange={handleChange} 
							className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
								errors.username 
									? "border-red-500 focus:ring-red-300" 
									: "border-gray-300 focus:ring-amber-500"
							}`}
							placeholder="Nhập họ tên của bạn" 
							required 
							disabled={loading} 
						/>
						{errors.username && (
							<p className="mt-1 text-red-600 text-sm">{errors.username}</p>
						)}
					</div>
					
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">
							Email của bạn
						</label>
						<input 
							name="email" 
							type="email" 
							value={formData.email}
							onChange={handleChange} 
							className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
								errors.email || emailAvailable === false
									? "border-red-500 focus:ring-red-300" 
									: emailAvailable === true
									? "border-green-500 focus:ring-green-300"
									: "border-gray-300 focus:ring-amber-500"
							}`}
							placeholder="Nhập email" 
							required 
							disabled={loading} 
						/>
						{errors.email ? (
							<p className="mt-1 text-red-600 text-sm">{errors.email}</p>
						) : (
							renderEmailStatus()
						)}
					</div>
					
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">
							Mật khẩu
						</label>
						<input 
							name="password" 
							type="password" 
							value={formData.password}
							onChange={handleChange} 
							className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
								errors.password 
									? "border-red-500 focus:ring-red-300" 
									: "border-gray-300 focus:ring-amber-500"
							}`}
							placeholder="Ít nhất 6 ký tự" 
							required 
							disabled={loading} 
						/>
						{errors.password && (
							<p className="mt-1 text-red-600 text-sm">{errors.password}</p>
						)}
					</div>
					
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">
							Xác nhận mật khẩu
						</label>
						<input 
							name="confirmPassword" 
							type="password" 
							value={formData.confirmPassword}
							onChange={handleChange} 
							className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
								errors.confirmPassword 
									? "border-red-500 focus:ring-red-300" 
									: "border-gray-300 focus:ring-amber-500"
							}`}
							placeholder="Nhập lại mật khẩu" 
							required 
							disabled={loading} 
						/>
						{errors.confirmPassword && (
							<p className="mt-1 text-red-600 text-sm">{errors.confirmPassword}</p>
						)}
					</div>

					<button 
						type="submit" 
						disabled={loading || emailChecking || emailAvailable === false}
						className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
							loading || emailChecking || emailAvailable === false
								? "bg-gray-400 cursor-not-allowed"
								: "bg-amber-600 hover:bg-amber-700"
						}`}
					>
						{loading ? "Đang đăng ký..." : "Đăng Ký"}
					</button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-gray-600">
						Đã có tài khoản?
						<Link 
							to="/customer/login" 
							state={{ from: from }} 
							className="ml-2 text-amber-600 font-semibold hover:text-amber-700"
						>
							Đăng nhập ngay
						</Link>
					</p>
					<div className="mt-4 pt-4 border-t border-gray-200">
						<button 
							onClick={() => navigate(from)} 
							className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
							disabled={loading}
						>
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Quay lại menu
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
