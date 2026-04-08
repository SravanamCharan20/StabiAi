import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiArrowRight } from 'react-icons/hi';
import { RiRobot2Line } from 'react-icons/ri';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/employee/predict');
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] 
    [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px)] 
    [background-size:132px_100%]">
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                <RiRobot2Line className="text-2xl" />
              </span>
              <span className="text-xl font-semibold uppercase tracking-[0.15em] text-slate-700">
                Career Shield
              </span>
            </Link>
            <h1 className="mt-6 text-3xl font-semibold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to access your risk intelligence workspace
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <HiArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-slate-900 hover:underline">
                Create one
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing in, you agree to our responsible AI usage policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
