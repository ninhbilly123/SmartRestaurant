import React from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from "recharts";
import { DollarSign, ShoppingBag, Users, Utensils, Calendar, Clock } from "lucide-react";
import Loading from "../../components/common/Loading";
import useReportData from "../../hooks/useReportData";
import { formatCurrency } from "../../utils/reportData";

const ReportPage = () => {
  const {
    dateRange,
    fetchData,
    handleDateChange,
    loading,
    peakHours,
    revenueData,
    stats,
    topItems,
  } = useReportData();

  if (loading) return <Loading />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Báo cáo doanh thu</h1>
          <p className="text-gray-500">Theo dõi hiệu quả kinh doanh & xu hướng</p>
        </div>

        {/* BỘ LỌC NGÀY */}
        <div className="bg-white p-2 rounded-lg shadow-sm border flex items-center gap-2">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={18} className="text-gray-500"/>
                <span className="text-sm font-medium text-gray-700">Từ:</span>
                <input 
                    type="date" 
                    name="fromDate"
                    value={dateRange.fromDate}
                    onChange={handleDateChange}
                    className="border-none outline-none text-sm text-gray-600 bg-transparent"
                />
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2 px-2">
                <span className="text-sm font-medium text-gray-700">Đến:</span>
                <input 
                    type="date" 
                    name="toDate"
                    value={dateRange.toDate}
                    onChange={handleDateChange}
                    className="border-none outline-none text-sm text-gray-600 bg-transparent"
                />
            </div>
            <button 
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
                Lọc dữ liệu
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Doanh thu hôm nay</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenue)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-lg text-green-600"><DollarSign size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
             <div>
              <p className="text-sm font-medium text-gray-500">Đơn hàng hôm nay</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.orders}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><ShoppingBag size={24} /></div>
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
             <div>
              <p className="text-sm font-medium text-gray-500">Khách đang ngồi</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.activeTables}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Users size={24} /></div>
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
             <div>
              <p className="text-sm font-medium text-gray-500">Tổng món phục vụ</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">--</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Utensils size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Chart: Doanh thu */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-green-500"/> Doanh thu theo thời gian
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tickFormatter={(value) => `${value/1000}k`} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Top Món */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Utensils size={20} className="text-orange-500"/> Top món bán chạy
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topItems} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fontWeight: 500}} />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => value} />
                <Bar dataKey="value" fill="#f59e0b" barSize={20} radius={[0, 4, 4, 0]}>
                   {topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f59e0b' : '#ea580c'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500"/> Khung giờ cao điểm
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    formatter={(value) => [`${value} đơn`, 'Số lượng']}
                    labelFormatter={(label) => `Giờ: ${label}`}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
};

export default ReportPage;
