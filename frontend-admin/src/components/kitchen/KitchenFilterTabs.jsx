import React from "react";

const KitchenFilterTabs = ({ activeFilter, onFilterChange, tabs }) => {
  return (
    <div className="bg-white border-b sticky top-[64px] z-10 shadow-sm">
      <div className="max-w-8xl mx-auto px-4 flex overflow-x-auto gap-4 pt-3 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`pb-3 px-4 text-sm font-bold uppercase border-b-4 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeFilter === tab.key
                ? tab.color || "border-gray-800 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KitchenFilterTabs;
