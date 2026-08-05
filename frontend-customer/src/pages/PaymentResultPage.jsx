import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Home, Loader, RefreshCw, XCircle } from "lucide-react";
import CustomerService from "../services/customerService";
import { getTableSession } from "../utils/tableSession";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const orderId = searchParams.get("orderId");
      const resultCode = searchParams.get("resultCode");
      const momoMessage = searchParams.get("message");
      const transId = searchParams.get("transId");

      if (!orderId) {
        setStatus("failed");
        setMessage("Khong tim thay thong tin don hang");
        return;
      }

      try {
        if (resultCode === "0") {
          setStatus("success");
          setMessage("Thanh toan dang duoc xu ly!");
          setOrderInfo({ orderId, transId });
          return;
        }

        if (resultCode) {
          setStatus("failed");
          setMessage(momoMessage || "Thanh toan that bai");
          return;
        }

        const statusResult = await CustomerService.checkMomoPaymentStatus(orderId);
        if (statusResult.resultCode === 0) {
          setStatus("success");
          setMessage("Thanh toan thanh cong!");
          setOrderInfo({ orderId, transId: statusResult.transId });
        } else {
          setStatus("failed");
          setMessage(statusResult.message || "Thanh toan that bai hoac da huy");
        }
      } catch (error) {
        console.error("Payment result error:", error);
        setStatus("failed");
        setMessage(error.message || "Da co loi xay ra");
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleGoToMenu = () => {
    const { tableId, token } = getTableSession();
    navigate(tableId && token ? `/menu?table=${tableId}&token=${token}` : "/menu");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        {status === "loading" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
              <Loader size={40} className="text-purple-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dang xu ly thanh toan
            </h1>
            <p className="text-gray-600">Vui long doi trong giay lat...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              {message}
            </h1>
            <p className="text-gray-600 mb-6">
              Cam on quy khach da su dung dich vu!
            </p>

            {orderInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ma don hang:</span> #
                  {orderInfo.orderId?.slice(-6).toUpperCase()}
                </p>
                {orderInfo.transId && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Ma giao dich:</span>{" "}
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
              Quay lai thuc don
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Thanh toan that bai
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Thu lai
              </button>

              <button
                onClick={handleGoToMenu}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Quay lai thuc don
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
