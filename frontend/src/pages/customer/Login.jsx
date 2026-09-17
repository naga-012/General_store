import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please provide email/mobile and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(identifier.trim(), password);
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (redirect === 'checkout') {
        navigate('/checkout');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl space-y-6">
        {/* Header & Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/30">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manikanta Supermarket
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your Registered Mobile Number or Email
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="customer@example.com or 9876543210"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            {loading ? (
              'Signing In...'
            ) : (
              <>
                Login to Store <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
