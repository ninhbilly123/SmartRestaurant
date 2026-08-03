import React from "react";
import { Edit, Lock, Unlock } from "lucide-react";
import UserRoleBadge from "./UserRoleBadge";
import UserStatusBadge from "./UserStatusBadge";

const UserTable = ({
  emptyText = "Chưa có dữ liệu.",
  loading,
  onEdit,
  onToggleStatus,
  showId = false,
  showRoleIcon = false,
  theme = "blue",
  users,
}) => {
  const isTeal = theme === "teal";
  const wrapperClass = isTeal
    ? "bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    : "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden";
  const tableClass = isTeal ? "w-full" : "w-full text-left border-collapse";
  const headClass = isTeal
    ? "bg-gradient-to-r from-gray-50 to-teal-50 border-b-2 border-gray-200"
    : "bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider";
  const rowHoverClass = isTeal
    ? "hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent"
    : "hover:bg-blue-50/50";

  return (
    <div className={wrapperClass}>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead className={headClass}>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                STT
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                {showId ? "Thông tin" : "Họ tên"}
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tên đăng nhập
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />{" "}
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user.id}
                  className={`${rowHoverClass} transition-all group`}
                >
                  <td className="px-6 py-4">
                    {isTeal ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 font-mono">
                        {index + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {user.full_name}
                    </p>
                    {showId && (
                      <p className="text-xs text-gray-400">ID: {user.id}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        isTeal
                          ? "font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700"
                          : "font-mono text-blue-600 text-sm"
                      }
                    >
                      {user.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <UserRoleBadge role={user.role} showIcon={showRoleIcon} />
                  </td>
                  <td className="px-6 py-4">
                    <UserStatusBadge
                      isActive={user.is_active}
                      rounded={isTeal ? "lg" : "full"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className={
                          isTeal
                            ? "p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:scale-110"
                            : "p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        }
                        onClick={() => onEdit(user)}
                        title="Sửa thông tin"
                      >
                        <Edit size={isTeal ? 16 : 18} />
                      </button>
                      <button
                        className={`${
                          isTeal
                            ? "p-2.5 rounded-lg transition-all hover:scale-110"
                            : "p-2 rounded-lg transition-colors"
                        } ${
                          user.is_active
                            ? "text-red-600 bg-red-50 hover:bg-red-100"
                            : "text-green-600 bg-green-50 hover:bg-green-100"
                        }`}
                        onClick={() => onToggleStatus(user)}
                        title={user.is_active ? "Khóa tài khoản" : "Mở khóa"}
                      >
                        {user.is_active ? (
                          <Lock size={isTeal ? 16 : 18} />
                        ) : (
                          <Unlock size={isTeal ? 16 : 18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
