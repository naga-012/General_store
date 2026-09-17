import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import api from '../../services/api';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/admin/customers');
        if (res.data.success) {
          setCustomers(res.data.customers);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Registered Store Customers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View customer contact records, order frequency, and lifetime spending
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">
            Loading customer list...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-400">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Mobile & Email</th>
                  <th className="p-4">Address</th>
                  <th className="p-4 text-center">Orders Placed</th>
                  <th className="p-4 text-right">Total Spent</th>
                  <th className="p-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs shrink-0 border border-amber-500/30">
                          {c.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <span className="text-[10px] text-slate-500">Customer ID: {c._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <a
                        href={`tel:${c.mobile}`}
                        className="text-amber-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {c.mobile}
                      </a>
                      <span className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs text-slate-400">
                      <p className="line-clamp-2">
                        {c.address || 'In-store Pickup'}
                      </p>
                    </td>

                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs border border-slate-800 inline-flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-amber-400" />
                        {c.orderCount || 0}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-black text-white text-sm">
                        ₹{c.totalSpent?.toLocaleString() || 0}
                      </span>
                    </td>

                    <td className="p-4 text-right text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
