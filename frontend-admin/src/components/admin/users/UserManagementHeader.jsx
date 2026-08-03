import React from "react";
import { UserPlus, X } from "lucide-react";

const UserManagementHeader = ({
  actionLabel,
  closeLabel = "Đóng",
  description,
  icon: Icon,
  isFormOpen,
  onToggleForm,
  theme = "blue",
  title,
}) => {
  const themeClasses = {
    blue: {
      icon: "bg-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
      title: "text-gray-800",
      wrapper: "mb-6",
    },
    teal: {
      icon: "bg-gradient-to-br from-teal-500 to-teal-600 shadow-md",
      button:
        "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
      title: "bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent",
      wrapper: "bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100",
    },
  };

  const classes = themeClasses[theme] || themeClasses.blue;

  if (theme === "teal") {
    return (
      <div className={classes.wrapper}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${classes.icon}`}>
              {Icon ? <Icon size={24} /> : <UserPlus size={24} />}
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${classes.title}`}>
                {title}
              </h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onToggleForm}
            className={`${
              isFormOpen
                ? "bg-gray-500 hover:bg-gray-600"
                : classes.button
            } text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all transform hover:scale-105`}
          >
            {isFormOpen ? (
              <>
                <X size={18} /> {closeLabel}
              </>
            ) : (
              <>
                <UserPlus size={18} /> {actionLabel}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggleForm}
        className={`${
          isFormOpen ? "bg-gray-500" : classes.button
        } text-white px-4 py-2 rounded shadow hover:opacity-90 flex items-center gap-2 transition-all`}
      >
        {isFormOpen ? (
          <>
            <X size={18} /> {closeLabel}
          </>
        ) : (
          <>
            <UserPlus size={18} /> {actionLabel}
          </>
        )}
      </button>
    </div>
  );
};

export default UserManagementHeader;
