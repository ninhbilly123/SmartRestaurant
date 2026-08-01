import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader, Home, RefreshCw } from "lucide-react";
import CustomerService from "../services/customerService";
import { getTableSession } from "../utils/tableSession";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading, success, failed
  const [message, setMessage] = useState("");
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Lấy các params từ URL (MoMo redirect về)
      const orderId = searchParams.get("orderId");
      const resultCode = searchParams.get("resultCode");
      const momoMessage = searchParams.get("message");
      const transId = searchParams.get("transId");

      console.log("Payment result params:", {
        orderId,
        resultCode,
        momoMessage,
        transId,
      });

      if (!orderId) {
        setStatus("failed");
        setMessage("Không tìm thấy thông tin đơn hàng");
        return;
      }

      try {
        // Kiểm tra resultCode từ MoMo (0 = thành công)
        if (resultCode === "0") {
          // Thanh toán thành công - hoàn tất order
          try {
            await CustomerService.completePayment(
              orderId,
              transId || `MOMO_${Date.now()}`,
              "momo"
            );
            setStatus("success");
            setMessage("Thanh toán thành công!");
            setOrderInfo({ orderId, transId });
          } catch (completeError) {
            // Có thể order đã được hoàn tất bởi IPN callback
            console.log(
              "Complete payment error (có thể đã được xử lý):",
              completeError
            );
            setStatus("success");
            setMessage("Thanh toán đã được xử lý!");
            setOrderInfo({ orderId, transId });
          }
        } else if (resultCode) {
          // Có resultCode nhưng không phải 0 = thất bại
          setStatus("failed");
          setMessage(momoMessage || "Thanh toán thất bại");
        } else {
          // Không có resultCode - kiểm tra trạng thái từ API
          try {
            const statusResult = await CustomerService.checkMomoPaymentStatus(
              orderId
            );
            console.log("Check status result:", statusResult);

            if (statusResult.resultCode === 0) {
              setStatus("success");
              setMessage("Thanh toán thành công!");
              setOrderInfo({ orderId, transId: statusResult.transId });
            } else {
              setStatus("failed");
              setMessage(
                statusResult.message || "Thanh toán thất bại hoặc đã hủy"
              );
            }
          } catch (statusError) {
            console.error("Check status error:", statusError);
            setStatus("failed");
            setMessage("Không thể xác nhận trạng thái thanh toán");
          }
        }
      } catch (error) {
        console.error("Payment result error:", error);
        setStatus("failed");
        setMessage(error.message || "Đã có lỗi xảy ra");
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleGoToMenu = () => {
    // Lấy tableId và token đã lưu trước khi chuyển sang cổng thanh toán
    const { tableId, token } = getTableSession();

    if (tableId && token) {
      navigate(`/menu?table=${tableId}&token=${token}`);
    } else {
      navigate("/menu");
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
              <Loader size={40} className="text-purple-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý thanh toán
            </h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              {message}
            </h1>
            <p className="text-gray-600 mb-6">
              Cảm ơn quý khách đã sử dụng dịch vụ!
            </p>

            {orderInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Mã đơn hàng:</span> #
                  {orderInfo.orderId?.slice(-6).toUpperCase()}
                </p>
                {orderInfo.transId && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Mã giao dịch:</span>{" "}
                    {orderInfo.transId}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleGoToMenu}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Quay lại thực đơn
            </button>
          </>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Thử lại
              </button>

              <button
                onClick={handleGoToMenu}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Quay lại thực đơn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
