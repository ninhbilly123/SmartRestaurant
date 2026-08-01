import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-gray-600 mb-6">Không tìm thấy trang bạn yêu cầu.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Về trang chính
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
