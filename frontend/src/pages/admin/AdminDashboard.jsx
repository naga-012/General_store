import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Clock,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ dailySales: [], topProducts: [] });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setLowStockProducts(res.data.lowStockProducts);
        setRecentOrders(res.data.recentOrders);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-xl w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Shop Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time counter pickups, order packaging, inventory & revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/add"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            + Add New Product
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 transition"
          >
            Manage All Orders
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-300">
                Low Stock Alert ({lowStockProducts.length} items need replenishment)
              </h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {lowStockProducts.map((p) => p.name).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? ' and more' : ''} have low stock levels.
              </p>
            </div>
          </div>
          <Link
            to="/admin/products?filter=low-stock"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs self-start sm:self-center transition"
          >
            Restock Items
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              ₹{stats?.totalSales?.toLocaleString() || 0}
            </span>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
              ₹{stats?.todaySales?.toLocaleString() || 0} today
            </p>
          </div>
        </div>

        {/* New Orders */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              New Orders
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {stats?.newOrders || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Needs review & acceptance
            </p>
          </div>
        </div>

        {/* Packed Orders */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ready for Pickup
            </span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-400">
              {stats?.packedOrders || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Waiting for customer collection
            </p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Orders
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats?.completedOrders || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {stats?.totalOrders || 0} total orders
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catalog Items
            </span>
            <div className="p-2 rounded-2xl bg-brand-500/10 text-brand-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats?.totalProducts || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Active inventory items
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Customers
            </span>
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats?.totalCustomers || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Accounts created
            </p>
          </div>
        </div>

        {/* In Preparation / Pending */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Packing / Accepted
            </span>
            <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-sky-400">
              {stats?.pendingOrders || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Currently being weighed
            </p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Low Stock Warnings
            </span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {stats?.lowStockCount || 0}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Items at threshold
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Sales Trend Chart */}
        <div className="lg:col-span-8 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Daily Revenue Trend</h3>
              <p className="text-xs text-slate-400">Past 7 days counter sales volume</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailySales || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`₹${value}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base text-white">Top Ordered Staples</h3>
            <p className="text-xs text-slate-400">Highest revenue products</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base text-white">Recent Customer Orders</h3>
            <p className="text-xs text-slate-400">Latest incoming pickup requests</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3 font-mono font-bold text-white">
                    {order.orderId}
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-200">{order.customerName}</p>
                    <span className="text-[10px] text-slate-400">{order.customerMobile}</span>
                  </td>
                  <td className="p-3">
                    {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                  </td>
                  <td className="p-3 font-bold text-white">₹{order.grandTotal}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.orderStatus === 'ORDER_PLACED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : order.orderStatus === 'ORDER_ACCEPTED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : order.orderStatus === 'PACKED' || order.orderStatus === 'READY_FOR_PICKUP'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : order.orderStatus === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to="/admin/orders"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
